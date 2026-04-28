import { Router, Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { authenticate } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabaseClient';
import { downloadFromS3 } from '../services/s3Client';
import { sendSuccess, sendError } from '../utils/apiResponse';
import logger from '../utils/logger';

const router: Router = Router();
router.use(authenticate);

// =============================================
// GET /analytics/dashboard
// Datos del dashboard principal
// =============================================
router.get('/dashboard', async (req: Request, res: Response) => {
  console.log('📊 Dashboard handler ejecutado, user:', req.user?.id);
  try {
        const userId = req.user!.id;
        const now = new Date();
        const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString().split('T')[0];
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            .toISOString().split('T')[0];
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
            .toISOString().split('T')[0];

    // Mes actual
    const { data: currentMonth } = await supabaseAdmin
        .from('receipts')
        .select('total_amount, tax_amount, category')
        .eq('user_id', userId)
        .eq('processing_status', 'completed')
        .gte('receipt_date', firstDayThisMonth);

    // Mes anterior
    const { data: lastMonth } = await supabaseAdmin
        .from('receipts')
        .select('total_amount')
        .eq('user_id', userId)
        .eq('processing_status', 'completed')
        .gte('receipt_date', firstDayLastMonth)
        .lte('receipt_date', lastDayLastMonth);

    // Recibos pendientes de revisión
    const { count: reviewCount } = await supabaseAdmin
        .from('receipts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('processing_status', 'review');

    // Uso del plan
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('receipts_count_this_month, plan')
        .eq('id', userId)
        .single();

    // Calcular totales
    const currentTotal = (currentMonth || []).reduce(
        (sum, r) => sum + (r.total_amount || 0), 0
    );
    const lastTotal = (lastMonth || []).reduce(
        (sum, r) => sum + (r.total_amount || 0), 0
    );
    const taxRecoverable = (currentMonth || []).reduce(
        (sum, r) => sum + (r.tax_amount || 0), 0
    );

    // Top categorías
    const categoryTotals: Record<string, number> = {};
    (currentMonth || []).forEach((r) => {
        if (r.category) {
            categoryTotals[r.category] = (categoryTotals[r.category] || 0) + (r.total_amount || 0);
        }
    });
    const topCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 }));

    const percentageChange = lastTotal > 0
      ? Math.round(((currentTotal - lastTotal) / lastTotal) * 100)
        : 0;

    return sendSuccess(res, {
        current_month: {
            total: Math.round(currentTotal * 100) / 100,
            receipt_count: (currentMonth || []).length,
            tax_recoverable: Math.round(taxRecoverable * 100) / 100,
        },
        last_month: {
            total: Math.round(lastTotal * 100) / 100,
            receipt_count: (lastMonth || []).length,
        },
        percentage_change: percentageChange,
        top_categories: topCategories,
        pending_review: reviewCount || 0,
        plan_usage: {
            count: profile?.receipts_count_this_month || 0,
            limit: profile?.plan === 'pro' ? null : 15,
        },
        });
    } catch (error) {
        logger.error('Error fetching dashboard data', { error });
        return sendError(res, 'Error obteniendo datos del dashboard');
    }
});

// =============================================
// GET /analytics/export-pdf
// =============================================
router.get('/export-pdf', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const { data: receipts, error } = await supabaseAdmin
      .from('receipts')
      .select('*')
      .eq('user_id', userId)
      .eq('processing_status', 'completed')
      .order('receipt_date', { ascending: false })
      .limit(50);

    if (error) return sendError(res, 'Error obteniendo recibos');

    const doc = new PDFDocument({ margin: 40, size: 'A4', autoFirstPage: true });
    const filename = `recibos_${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    // Portada
    doc.fontSize(22).font('Helvetica-Bold').text('ReceiptAI — Mis Recibos', { align: 'center' });
    doc.fontSize(11).font('Helvetica').text(
      `Generado: ${new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}  |  ${(receipts || []).length} recibos`,
      { align: 'center' }
    );
    doc.moveDown(1.5);

    for (const receipt of receipts || []) {
      // Separador de recibo
      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#E8E8F0').lineWidth(1).stroke();
      doc.moveDown(0.5);

      const startY = doc.y;

      // Imagen a la derecha (si existe)
      let imageWidth = 0;
      if (receipt.image_key) {
        try {
          const imgBuffer = await downloadFromS3(receipt.image_key);
          const imgX = 400;
          doc.image(imgBuffer, imgX, startY, { width: 155, height: 110, cover: [155, 110] });
          imageWidth = 170;
        } catch { /* imagen no disponible — continuar */ }
      }

      const textWidth = 555 - 40 - imageWidth;

      // Datos del recibo
      doc.fontSize(13).font('Helvetica-Bold')
        .text(receipt.merchant_name || 'Sin comercio', 40, startY, { width: textWidth });
      doc.fontSize(10).font('Helvetica').fillColor('#6B7280')
        .text(receipt.receipt_date
          ? new Date(receipt.receipt_date).toLocaleDateString('es-CO', { dateStyle: 'medium' })
          : 'Sin fecha', { width: textWidth });
      doc.fillColor('#1A1A2E');

      if (receipt.total_amount != null) {
        doc.fontSize(16).font('Helvetica-Bold')
          .text(`${receipt.currency || 'COP'} ${Number(receipt.total_amount).toLocaleString('es-CO')}`, { width: textWidth });
      }

      doc.fontSize(10).font('Helvetica');
      if (receipt.tax_amount != null) {
        doc.fillColor('#6B7280')
          .text(`IVA: ${receipt.currency || 'COP'} ${Number(receipt.tax_amount).toLocaleString('es-CO')}`, { width: textWidth });
      }
      doc.fillColor('#6C63FF')
        .text(receipt.category || 'Sin categoría', { width: textWidth });
      doc.fillColor('#1A1A2E');

      // Garantizar espacio mínimo para la imagen
      const minY = startY + 120;
      if (doc.y < minY) doc.y = minY;

      doc.moveDown(1);
    }

    doc.end();
  } catch (error) {
    logger.error('Error generating PDF', { error });
    if (!res.headersSent) sendError(res, 'Error generando PDF');
  }
});

// =============================================
// GET /analytics/export-csv
// =============================================
router.get('/export-csv', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const { data, error } = await supabaseAdmin
      .from('receipts')
      .select('merchant_name, receipt_date, total_amount, tax_amount, currency, category, processing_status, created_at')
      .eq('user_id', userId)
      .eq('processing_status', 'completed')
      .order('receipt_date', { ascending: false });

    if (error) return sendError(res, 'Error obteniendo recibos');

    const header = 'Comercio,Fecha,Total,IVA,Moneda,Categoría,Creado\n';
    const rows = (data || []).map((r) => {
      const escape = (v: string | null | undefined) =>
        v ? `"${String(v).replace(/"/g, '""')}"` : '';
      return [
        escape(r.merchant_name),
        r.receipt_date || '',
        r.total_amount ?? '',
        r.tax_amount ?? '',
        r.currency || '',
        escape(r.category),
        r.created_at ? r.created_at.split('T')[0] : '',
      ].join(',');
    });

    const csv = header + rows.join('\n');
    const filename = `recibos_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('﻿' + csv); // BOM para Excel
  } catch (error) {
    logger.error('Error generating CSV', { error });
    return sendError(res, 'Error generando CSV');
  }
});

export default router;