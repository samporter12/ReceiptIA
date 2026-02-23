import { Router, Request, Response } from 'express';
import { authenticate, checkPlanLimits } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabaseClient';
import { generateUploadPresignedUrl, generateViewPresignedUrl, deleteFromS3 } from '../services/s3Client';
import { processReceiptImage } from '../services/ocrService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import logger from '../utils/logger';

const router: Router = Router();

router.use(authenticate);

// =============================================
// POST /receipts/upload-url
// =============================================
router.post('/upload-url', checkPlanLimits, async (req: Request, res: Response) => {
  try {
    const { file_extension = 'jpg' } = req.body;
    const userId = req.user!.id;

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic'];
    if (!allowedExtensions.includes(file_extension.toLowerCase())) {
      return sendError(res, 'Formato de imagen no soportado', 400);
    }

    const { uploadUrl, imageKey } = await generateUploadPresignedUrl(userId, file_extension);
    return sendSuccess(res, { upload_url: uploadUrl, image_key: imageKey });
  } catch (error) {
    logger.error('Error generating upload URL', { error });
    return sendError(res, 'Error generando URL de subida');
  }
});

// =============================================
// POST /receipts/process
// =============================================
router.post('/process', checkPlanLimits, async (req: Request, res: Response) => {
  try {
    const { image_key } = req.body;
    const userId = req.user!.id;

    if (!image_key) {
      return sendError(res, 'image_key es requerido', 400);
    }

    // Crear registro inicial en estado "processing"
    const { data: receipt, error: insertError } = await supabaseAdmin
      .from('receipts')
      .insert({
        user_id: userId,
        image_key,
        image_url: image_key,
        processing_status: 'processing',
      })
      .select()
      .single();

    if (insertError || !receipt) {
      logger.error('Error creating receipt record', { insertError });
      return sendError(res, 'Error creando registro de recibo');
    }

    // Procesar en background
    processReceiptAsync(receipt.id, image_key, userId);

    return sendSuccess(
      res,
      { receipt_id: receipt.id, status: 'processing' },
      'Recibo en procesamiento.',
      202
    );
  } catch (error) {
    logger.error('Error initiating receipt processing', { error });
    return sendError(res, 'Error iniciando procesamiento');
  }
});

// =============================================
// PROCESAMIENTO ASÍNCRONO — OCR + IA
// =============================================
const processReceiptAsync = async (
  receiptId: string,
  imageKey: string,
  userId: string
): Promise<void> => {
  const startTime = Date.now();
  logger.info(`⚙️ Procesando recibo ${receiptId}...`);

  try {
    const { extracted, rawText } = await processReceiptImage(imageKey);

    const processingTime = Date.now() - startTime;
    logger.info(`⏱️ Tiempo de procesamiento: ${processingTime}ms`);

    const status = extracted.needs_review ? 'review' : 'completed';

    const { error: updateError } = await supabaseAdmin
      .from('receipts')
      .update({
        merchant_name: extracted.merchant_name,
        receipt_date: extracted.date,
        total_amount: extracted.total_amount,
        tax_amount: extracted.tax_amount,
        currency: extracted.currency,
        category: extracted.category,
        confidence_score: extracted.confidence,
        needs_review: extracted.needs_review,
        processing_status: status,
        raw_ocr_text: rawText,
      })
      .eq('id', receiptId);

    if (updateError) {
      logger.error('❌ Error actualizando recibo', { updateError });
      throw updateError;
    }

    // Incrementar contador mensual
    await supabaseAdmin.rpc('increment_receipt_count', { user_id: userId });

    logger.info(`✅ Recibo ${receiptId} — status: ${status}, confidence: ${extracted.confidence}`);

  } catch (error: any) {
    logger.error(`❌ Error procesando recibo ${receiptId}`, { error: error.message });

    await supabaseAdmin
      .from('receipts')
      .update({
        processing_status: 'failed',
        raw_ocr_text: `Error: ${error.message}`,
      })
      .eq('id', receiptId);
  }
};

// =============================================
// GET /receipts
// =============================================
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      page = '1',
      limit = '20',
      category,
      status,
      search,
      start_date,
      end_date,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, parseInt(limit as string));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('receipts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (category) query = query.eq('category', category);
    if (status) query = query.eq('processing_status', status);
    if (start_date) query = query.gte('receipt_date', start_date);
    if (end_date) query = query.lte('receipt_date', end_date);
    if (search) {
      query = query.textSearch('search_vector', search as string, {
        config: 'spanish',
      });
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('Error fetching receipts', { error });
      return sendError(res, 'Error obteniendo recibos');
    }

    // Generar URLs firmadas
    const receiptsWithUrls = await Promise.all(
      (data || []).map(async (receipt) => ({
        ...receipt,
        image_url: await generateViewPresignedUrl(receipt.image_key),
      }))
    );

    return res.json({
      success: true,
      data: receiptsWithUrls,
      pagination: {
        total: count || 0,
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (error) {
    logger.error('Error listing receipts', { error });
    return sendError(res, 'Error listando recibos');
  }
});

// =============================================
// GET /receipts/:id
// =============================================
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const { data, error } = await supabaseAdmin
      .from('receipts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return sendError(res, 'Recibo no encontrado', 404);
    }

    const imageUrl = await generateViewPresignedUrl(data.image_key);
    return sendSuccess(res, { ...data, image_url: imageUrl });
  } catch (error) {
    logger.error('Error fetching receipt', { error });
    return sendError(res, 'Error obteniendo recibo');
  }
});

// =============================================
// PATCH /receipts/:id
// =============================================
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const {
      merchant_name,
      receipt_date,
      total_amount,
      tax_amount,
      currency,
      category,
    } = req.body;

    const { data, error } = await supabaseAdmin
      .from('receipts')
      .update({
        merchant_name,
        receipt_date,
        total_amount,
        tax_amount,
        currency,
        category,
        needs_review: false,
        processing_status: 'completed',
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      return sendError(res, 'Error actualizando recibo', 400);
    }

    return sendSuccess(res, data, 'Recibo actualizado correctamente');
  } catch (error) {
    logger.error('Error updating receipt', { error });
    return sendError(res, 'Error actualizando recibo');
  }
});

// =============================================
// DELETE /receipts/:id
// =============================================
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const { data, error } = await supabaseAdmin
      .from('receipts')
      .select('image_key')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return sendError(res, 'Recibo no encontrado', 404);
    }

    await deleteFromS3(data.image_key);

    await supabaseAdmin
      .from('receipts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    return sendSuccess(res, null, 'Recibo eliminado correctamente');
  } catch (error) {
    logger.error('Error deleting receipt', { error });
    return sendError(res, 'Error eliminando recibo');
  }
});

export default router;