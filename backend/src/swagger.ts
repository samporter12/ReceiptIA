/**
 * REPO-42: Documentación técnica del API (Swagger/OpenAPI 3.0)
 */

import { Application } from 'express';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'ReceiptAI API',
    version: '1.0.0',
    description: 'API para gestión inteligente de recibos con OCR e IA.',
    contact: { email: 'soporte@receiptai.app' },
  },
  servers: [
    { url: '/api/v1', description: 'Servidor de producción' },
    { url: 'http://localhost:3000/api/v1', description: 'Desarrollo local' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenido desde Supabase Auth',
      },
    },
    schemas: {
      Receipt: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          merchant_name: { type: 'string', example: 'Éxito' },
          receipt_date: { type: 'string', format: 'date', example: '2024-05-15' },
          total_amount: { type: 'number', example: 45000 },
          tax_amount: { type: 'number', example: 7200 },
          currency: { type: 'string', example: 'COP' },
          category: {
            type: 'string',
            enum: ['Alimentación','Transporte','Alojamiento','Software','Marketing','Oficina','Salud','Educación','Entretenimiento','Otro'],
          },
          confidence_score: { type: 'number', minimum: 0, maximum: 1, example: 0.92 },
          needs_review: { type: 'boolean' },
          processing_status: {
            type: 'string',
            enum: ['pending','processing','completed','failed','review'],
          },
          image_url: { type: 'string', format: 'uri' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      DashboardData: {
        type: 'object',
        properties: {
          current_month: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              receipt_count: { type: 'integer' },
              tax_recoverable: { type: 'number' },
            },
          },
          last_month: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              receipt_count: { type: 'integer' },
            },
          },
          percentage_change: { type: 'number' },
          top_categories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                total: { type: 'number' },
              },
            },
          },
          pending_review: { type: 'integer' },
          plan_usage: {
            type: 'object',
            properties: {
              count: { type: 'integer' },
              limit: { type: 'integer', nullable: true },
            },
          },
          monthly_trend: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                month: { type: 'string', example: 'may 24' },
                total: { type: 'number' },
              },
            },
          },
        },
      },
      ApiSuccess: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Mensaje de error' },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        tags: ['Sistema'],
        summary: 'Health check',
        security: [],
        responses: {
          200: {
            description: 'Servicio activo',
            content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' }, timestamp: { type: 'string' }, version: { type: 'string' } } } } },
          },
        },
      },
    },
    '/receipts/upload-url': {
      post: {
        tags: ['Recibos'],
        summary: 'Obtener URL prefirmada para subir imagen a S3',
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', properties: { file_extension: { type: 'string', example: 'jpg', default: 'jpg' } } } } },
        },
        responses: {
          200: { description: 'URL generada', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiSuccess' }, { type: 'object', properties: { data: { type: 'object', properties: { upload_url: { type: 'string', format: 'uri' }, image_key: { type: 'string' } } } } }] } } } },
          401: { description: 'No autorizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
          403: { description: 'Límite del plan alcanzado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
        },
      },
    },
    '/receipts/process': {
      post: {
        tags: ['Recibos'],
        summary: 'Iniciar procesamiento OCR + IA de una imagen ya subida',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['image_key'], properties: { image_key: { type: 'string', example: 'receipts/user-id/uuid.jpg' } } } } },
        },
        responses: {
          200: { description: 'Procesamiento iniciado', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiSuccess' }, { type: 'object', properties: { data: { type: 'object', properties: { receipt_id: { type: 'string', format: 'uuid' }, status: { type: 'string', example: 'processing' } } } } }] } } } },
          400: { description: 'Parámetros inválidos' },
          401: { description: 'No autorizado' },
        },
      },
    },
    '/receipts': {
      get: {
        tags: ['Recibos'],
        summary: 'Listar recibos del usuario con filtros y paginación',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 50 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Búsqueda de texto completo' },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending','processing','completed','failed','review'] } },
        ],
        responses: {
          200: { description: 'Lista de recibos', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiSuccess' }, { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Receipt' } }, meta: { type: 'object', properties: { total: { type: 'integer' }, page: { type: 'integer' }, limit: { type: 'integer' } } } } }] } } } },
        },
      },
    },
    '/receipts/{id}': {
      get: {
        tags: ['Recibos'],
        summary: 'Obtener detalle de un recibo',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Detalle del recibo', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiSuccess' }, { type: 'object', properties: { data: { $ref: '#/components/schemas/Receipt' } } }] } } } },
          404: { description: 'Recibo no encontrado' },
        },
      },
      patch: {
        tags: ['Recibos'],
        summary: 'Actualizar campos de un recibo',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', properties: { merchant_name: { type: 'string' }, receipt_date: { type: 'string', format: 'date' }, total_amount: { type: 'number' }, tax_amount: { type: 'number' }, currency: { type: 'string' }, category: { type: 'string' } } } } },
        },
        responses: {
          200: { description: 'Recibo actualizado' },
          404: { description: 'Recibo no encontrado' },
        },
      },
      delete: {
        tags: ['Recibos'],
        summary: 'Eliminar un recibo (BD + imagen S3)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Recibo eliminado' },
          404: { description: 'Recibo no encontrado' },
        },
      },
    },
    '/analytics/dashboard': {
      get: {
        tags: ['Analytics'],
        summary: 'Obtener datos del dashboard (totales, categorías, tendencia)',
        responses: {
          200: { description: 'Datos del dashboard', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiSuccess' }, { type: 'object', properties: { data: { $ref: '#/components/schemas/DashboardData' } } }] } } } },
        },
      },
    },
    '/analytics/export-csv': {
      get: {
        tags: ['Analytics'],
        summary: 'Exportar recibos como CSV',
        responses: {
          200: { description: 'Archivo CSV', content: { 'text/csv': { schema: { type: 'string' } } } },
        },
      },
    },
    '/analytics/export-pdf': {
      get: {
        tags: ['Analytics'],
        summary: 'Exportar recibos como PDF con imágenes adjuntas',
        responses: {
          200: { description: 'Archivo PDF', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } },
        },
      },
    },
    '/auth/account': {
      delete: {
        tags: ['Auth'],
        summary: 'Eliminar cuenta y todos los datos del usuario (GDPR) — REPO-40',
        description: 'Elimina permanentemente la cuenta, perfil, recibos e imágenes S3 del usuario.',
        responses: {
          200: { description: 'Cuenta eliminada correctamente' },
          401: { description: 'No autorizado' },
          500: { description: 'Error interno' },
        },
      },
    },
  },
};

export function setupSwagger(app: Application): void {
  // Endpoint que devuelve el JSON del spec
  app.get('/api/docs/spec.json', (_req, res) => {
    res.json(swaggerDocument);
  });

  // UI de Swagger embebida via CDN (sin dependencias npm)
  app.get('/api/docs', (_req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>ReceiptAI — API Docs</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/docs/spec.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout',
      deepLinking: true,
      defaultModelsExpandDepth: 1,
    });
  </script>
</body>
</html>`);
  });
}
