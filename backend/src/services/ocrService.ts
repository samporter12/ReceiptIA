import {
  TextractClient,
  AnalyzeExpenseCommand,
} from '@aws-sdk/client-textract';
import Groq from 'groq-sdk';
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

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });


const CATEGORIES: ReceiptCategory[] = [
  'Alimentación', 'Transporte', 'Alojamiento', 'Software',
  'Marketing', 'Oficina', 'Salud', 'Educación', 'Entretenimiento', 'Otro',
];

// =============================================
// PASO 1: AWS TEXTRACT
// =============================================
const extractWithTextract = async (imageKey: string): Promise<string> => {
  logger.info(`📄 Textract procesando: ${imageKey}`);

  const command = new AnalyzeExpenseCommand({
    Document: {
      S3Object: {
        Bucket: process.env.S3_BUCKET_NAME!,
        Name: imageKey,
      },
    },
  });

  const response = await textractClient.send(command);
  const lines: string[] = [];

  response.ExpenseDocuments?.forEach((doc) => {
    doc.SummaryFields?.forEach((field) => {
      const label = field.LabelDetection?.Text || '';
      const value = field.ValueDetection?.Text || '';
      const confidence = field.ValueDetection?.Confidence || 0;
      if (value && confidence > 50) {
        lines.push(`${label}: ${value}`);
      }
    });

    doc.LineItemGroups?.forEach((group) => {
      group.LineItems?.forEach((item) => {
        const parts: string[] = [];
        item.LineItemExpenseFields?.forEach((field) => {
          if (field.ValueDetection?.Text) {
            parts.push(field.ValueDetection.Text);
          }
        });
        if (parts.length) lines.push(`ITEM: ${parts.join(' | ')}`);
      });
    });
  });

  const rawText = lines.join('\n');
  logger.info(`📄 Textract extrajo ${lines.length} líneas`);
  return rawText;
};

// =============================================
// PASO 2: GEMINI
// =============================================
const enrichWithLLM = async (rawText: string): Promise<ExtractedReceiptData> => {
  logger.info('🤖 Enviando a Groq para enriquecimiento...');

  const prompt = `Eres un extractor experto de recibos fiscales latinoamericanos.

Analiza el siguiente texto extraído por OCR de un recibo y extrae datos estructurados.

REGLAS:
1. Corrige errores tipográficos del OCR
2. La fecha debe estar en formato ISO8601: YYYY-MM-DD
3. Los montos deben ser números decimales sin símbolo de moneda
4. La moneda como código ISO (USD, EUR, COP, MXN, etc.)
5. La categoría DEBE ser exactamente una de: ${CATEGORIES.join(', ')}
6. confidence: qué tan seguro estás (0.0 a 1.0)
7. needs_review: true si el recibo es ilegible o tiene datos contradictorios

TEXTO DEL RECIBO:
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

  // ✅ Llamada a Groq
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: 300,
  });

  const responseText = completion.choices[0]?.message?.content || '{}';
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