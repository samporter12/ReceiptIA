import {
  TextractClient,
  AnalyzeExpenseCommand,
  DetectDocumentTextCommand,
} from '@aws-sdk/client-textract';
import Anthropic from '@anthropic-ai/sdk';
import { ExtractedReceiptData, ReceiptCategory } from '../types';
import logger from '../utils/logger';

// =============================================
// CLIENTES
// =============================================
const textractClient = new TextractClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });


const CATEGORIES: ReceiptCategory[] = [
  'Alimentación', 'Transporte', 'Alojamiento', 'Software',
  'Marketing', 'Oficina', 'Salud', 'Educación', 'Entretenimiento', 'Otro',
];

// =============================================
// PASO 1A: Textract AnalyzeExpense (recibos físicos)
// =============================================
const extractWithAnalyzeExpense = async (imageKey: string): Promise<string> => {
  const command = new AnalyzeExpenseCommand({
    Document: { S3Object: { Bucket: process.env.S3_BUCKET_NAME!, Name: imageKey } },
  });

  const response = await textractClient.send(command);
  const lines: string[] = [];

  response.ExpenseDocuments?.forEach((doc) => {
    doc.SummaryFields?.forEach((field) => {
      const label = field.LabelDetection?.Text || '';
      const value = field.ValueDetection?.Text || '';
      const confidence = field.ValueDetection?.Confidence || 0;
      if (value && confidence > 50) lines.push(`${label}: ${value}`);
    });

    doc.LineItemGroups?.forEach((group) => {
      group.LineItems?.forEach((item) => {
        const parts: string[] = [];
        item.LineItemExpenseFields?.forEach((field) => {
          if (field.ValueDetection?.Text) parts.push(field.ValueDetection.Text);
        });
        if (parts.length) lines.push(`ITEM: ${parts.join(' | ')}`);
      });
    });
  });

  return lines.join('\n');
};

// =============================================
// PASO 1B: Textract DetectDocumentText (comprobantes digitales)
// =============================================
const extractWithDetectText = async (imageKey: string): Promise<string> => {
  const command = new DetectDocumentTextCommand({
    Document: { S3Object: { Bucket: process.env.S3_BUCKET_NAME!, Name: imageKey } },
  });

  const response = await textractClient.send(command);
  const lines: string[] = [];

  response.Blocks?.forEach((block) => {
    if (block.BlockType === 'LINE' && block.Text && (block.Confidence ?? 0) > 50) {
      lines.push(block.Text);
    }
  });

  return lines.join('\n');
};

// =============================================
// PASO 1: Orquestador — detecta tipo de comprobante
// =============================================
const DIGITAL_KEYWORDS = [
  'nequi', 'bancolombia', 'daviplata', 'movii', 'rappipay',
  'transferencia', 'comprobante', 'transacción exitosa', 'enviaste',
  'recibiste', 'pago exitoso', 'aprobada', 'referencia',
];

const isDigitalReceipt = (text: string): boolean => {
  const lower = text.toLowerCase();
  return DIGITAL_KEYWORDS.some((kw) => lower.includes(kw));
};

const extractWithTextract = async (imageKey: string): Promise<string> => {
  logger.info(`📄 Textract procesando: ${imageKey}`);

  const expenseText = await extractWithAnalyzeExpense(imageKey);
  const expenseLines = expenseText.split('\n').filter(Boolean).length;

  // Si AnalyzeExpense extrajo poco texto o parece comprobante digital, usar DetectText
  if (expenseLines < 4 || isDigitalReceipt(expenseText)) {
    logger.info(`📱 Detectado posible comprobante digital (${expenseLines} líneas en AnalyzeExpense) — usando DetectText`);
    const rawText = await extractWithDetectText(imageKey);
    logger.info(`📄 DetectText extrajo ${rawText.split('\n').filter(Boolean).length} líneas`);
    return rawText;
  }

  logger.info(`📄 AnalyzeExpense extrajo ${expenseLines} líneas`);
  return expenseText;
};

// =============================================
// PASO 2: LLM
// =============================================
const enrichWithLLM = async (rawText: string): Promise<ExtractedReceiptData> => {
  logger.info('🤖 Enviando a Groq para enriquecimiento...');

  const prompt = `Eres un extractor experto de comprobantes de pago latinoamericanos, tanto recibos físicos como comprobantes digitales (Nequi, Bancolombia, Daviplata, transferencias bancarias, pagos QR, etc.).

Analiza el siguiente texto extraído por OCR y extrae datos estructurados.

REGLAS GENERALES:
1. Corrige errores tipográficos del OCR
2. La fecha debe estar en formato ISO8601: YYYY-MM-DD
3. Los montos deben ser números decimales sin símbolo de moneda ni puntos de miles (ej: 45000.00)
4. La moneda como código ISO (COP, USD, EUR, MXN, etc.). Si no se especifica y parece colombiano, usa COP
5. La categoría DEBE ser exactamente una de: ${CATEGORIES.join(', ')}
6. confidence: qué tan seguro estás (0.0 a 1.0)
7. needs_review: true si el texto es ilegible o faltan datos críticos

REGLAS PARA COMPROBANTES DIGITALES:
- Si dice "Enviaste $X a [nombre]" → merchant_name = nombre del destinatario, categoría = Transporte o Otro
- Si dice "Pagaste en [comercio]" → merchant_name = nombre del comercio
- Si dice "Recarga" o "recargar" → categoría = Otro
- El monto principal es el que aparece más destacado o junto a "Total", "Valor", "Monto"
- Ignora montos de comisión o IVA de plataforma a menos que sean el único monto
- En transferencias entre personas, needs_review = false si el monto es claro

TEXTO DEL COMPROBANTE:
${rawText}

Responde ÚNICAMENTE con JSON válido, sin markdown, sin texto adicional:
{
  "merchant_name": "nombre o null",
  "date": "YYYY-MM-DD o null",
  "total_amount": número o null,
  "tax_amount": número o null,
  "currency": "COP",
  "category": "Alimentación",
  "confidence": 0.85,
  "needs_review": false
}`;

  const completion = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: 'Eres un extractor experto de comprobantes de pago latinoamericanos. Responde ÚNICAMENTE con JSON válido, sin markdown ni texto adicional.',
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = completion.content[0]?.type === 'text' ? completion.content[0].text : '{}';
  logger.debug(`🤖 Respuesta Groq: ${responseText}`);

  try {
    const clean = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const extracted = JSON.parse(clean) as ExtractedReceiptData;

    if (
      extracted.tax_amount !== null &&
      extracted.total_amount !== null &&
      extracted.tax_amount > extracted.total_amount
    ) {
      extracted.needs_review = true;
      extracted.confidence = Math.min(extracted.confidence, 0.4);
    }

    if (extracted.confidence < 0.6) extracted.needs_review = true;

    logger.info(`🤖 Extracción completada — confidence: ${extracted.confidence}`);
    return extracted;

  } catch (parseError) {
    logger.error('❌ Error parseando respuesta', { responseText });
    return {
      merchant_name: null,
      date: null,
      total_amount: null,
      tax_amount: null,
      currency: 'COP',
      category: 'Otro',
      confidence: 0,
      needs_review: true,
    };
  }
};

// =============================================
// PIPELINE PRINCIPAL
// =============================================
export const processReceiptImage = async (
  imageKey: string
): Promise<{ extracted: ExtractedReceiptData; rawText: string }> => {
  logger.info(`🚀 Iniciando pipeline OCR para: ${imageKey}`);

  try {
    const rawText = await extractWithTextract(imageKey);

    if (!rawText.trim()) {
      logger.warn('⚠️ Textract no extrajo texto — imagen posiblemente ilegible');
      return {
        rawText: '',
        extracted: {
          merchant_name: null,
          date: null,
          total_amount: null,
          tax_amount: null,
          currency: 'COP',
          category: 'Otro',
          confidence: 0,
          needs_review: true,
        },
      };
    }

    const extracted = await enrichWithLLM(rawText);
    return { extracted, rawText };

  } catch (error: any) {
    logger.error('❌ Error en pipeline OCR', { error: error.message });

    if (error.name === 'InvalidS3ObjectException') {
      throw new Error('Imagen no encontrada en S3');
    }
    if (error.name === 'UnsupportedDocumentException') {
      throw new Error('Formato de imagen no soportado');
    }

    throw error;
  }
};