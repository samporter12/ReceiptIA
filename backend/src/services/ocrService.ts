import {
    TextractClient,
    AnalyzeExpenseCommand,
    } from '@aws-sdk/client-textract';
    import OpenAI from 'openai';
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

    const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    });

    const CATEGORIES: ReceiptCategory[] = [
    'Alimentación', 'Transporte', 'Alojamiento', 'Software',
    'Marketing', 'Oficina', 'Salud', 'Educación', 'Entretenimiento', 'Otro',
    ];

    // =============================================
    // PASO 1: AWS TEXTRACT
    // Extrae texto crudo del recibo
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
        // Campos resumen (Total, Fecha, Comercio, etc.)
        doc.SummaryFields?.forEach((field) => {
        const label = field.LabelDetection?.Text || '';
        const value = field.ValueDetection?.Text || '';
        const confidence = field.ValueDetection?.Confidence || 0;
        if (value && confidence > 50) {
            lines.push(`${label}: ${value}`);
        }
        });

        // Ítems de línea (productos individuales)
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
    logger.debug(`📄 Texto crudo:\n${rawText}`);

    return rawText;
};

// =============================================
// PASO 2: OPENAI GPT-4o-mini
// Normaliza y enriquece los datos extraídos
// =============================================
const enrichWithLLM = async (rawText: string): Promise<ExtractedReceiptData> => {
    logger.info('🤖 Enviando a OpenAI para enriquecimiento...');

    const prompt = `Eres un extractor experto de recibos fiscales latinoamericanos.

    Analiza el siguiente texto extraído por OCR de un recibo y extrae datos estructurados.

    REGLAS:
    1. Corrige errores tipográficos del OCR (ej: "T0TAL" → "TOTAL", "0" confundido con "O")
    2. La fecha debe estar en formato ISO8601: YYYY-MM-DD
    3. Los montos deben ser números decimales sin símbolo de moneda (ej: 45.50)
    4. La moneda como código ISO (USD, EUR, COP, MXN, PEN, ARS, BRL, etc.)
    5. La categoría DEBE ser exactamente una de: ${CATEGORIES.join(', ')}
    6. confidence: qué tan seguro estás de los datos (0.0 a 1.0)
    7. needs_review: true si el recibo es ilegible, incompleto o tiene datos contradictorios
    8. Si el impuesto es mayor al total, needs_review debe ser true

    TEXTO DEL RECIBO:
    ${rawText}

    Responde ÚNICAMENTE con JSON válido, sin markdown, sin texto adicional:
    {
    "merchant_name": "nombre del comercio o null",
    "date": "YYYY-MM-DD o null",
    "total_amount": número o null,
    "tax_amount": número o null,
    "currency": "COP",
    "category": "Alimentación",
    "confidence": 0.85,
    "needs_review": false
    }`;

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 300,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    logger.debug(`🤖 Respuesta OpenAI: ${responseText}`);

    try {
        // Limpiar markdown si el modelo lo incluye
        const clean = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

        const extracted = JSON.parse(clean) as ExtractedReceiptData;

        // Validación de negocio: impuesto no puede superar el total
        if (
        extracted.tax_amount !== null &&
        extracted.total_amount !== null &&
        extracted.tax_amount > extracted.total_amount
        ) {
        logger.warn('⚠️ IVA mayor al total — marcando para revisión');
        extracted.needs_review = true;
        extracted.confidence = Math.min(extracted.confidence, 0.4);
        }

        // Si confidence es muy baja, forzar revisión
        if (extracted.confidence < 0.6) {
        extracted.needs_review = true;
        }

        logger.info(`🤖 Extracción completada — confidence: ${extracted.confidence}`);
        return extracted;

    } catch (parseError) {
        logger.error('❌ Error parseando respuesta LLM', { responseText, parseError });
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
// Combina Textract + OpenAI
// =============================================
export const processReceiptImage = async (
    imageKey: string
    ): Promise<{ extracted: ExtractedReceiptData; rawText: string }> => {
    logger.info(`🚀 Iniciando pipeline OCR para: ${imageKey}`);

    try {
        // Paso 1: OCR con Textract
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

        // Paso 2: Enriquecer con LLM
        const extracted = await enrichWithLLM(rawText);

        return { extracted, rawText };

    } catch (error: any) {
        logger.error('❌ Error en pipeline OCR', { error: error.message });

        // Si es error de AWS, dar mensaje claro
        if (error.name === 'InvalidS3ObjectException') {
        throw new Error('Imagen no encontrada en S3 — verifica que se subió correctamente');
        }
        if (error.name === 'UnsupportedDocumentException') {
        throw new Error('Formato de imagen no soportado — usa JPG, PNG o PDF');
        }

        throw error;
    }
};