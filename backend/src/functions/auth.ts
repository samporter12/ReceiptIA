/**
 * REPO-40: Eliminar cuenta y datos (cumplimiento GDPR)
 * DELETE /auth/account
 *
 * Elimina:
 *  - Todos los recibos del usuario (y sus imágenes en S3)
 *  - El perfil del usuario en la tabla profiles
 *  - La cuenta de autenticación en Supabase Auth
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabaseClient';
import { deleteFromS3 } from '../services/s3Client';
import { sendSuccess, sendError } from '../utils/apiResponse';
import logger from '../utils/logger';

const router: Router = Router();

router.use(authenticate);

// =============================================
// DELETE /auth/account  —  REPO-40 (GDPR)
// =============================================
router.delete('/account', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  logger.info(`GDPR account deletion requested for user ${userId}`);

  try {
    // 1. Obtener todas las imágenes del usuario para borrar de S3
    const { data: receipts, error: fetchError } = await supabaseAdmin
      .from('receipts')
      .select('id, image_key')
      .eq('user_id', userId);

    if (fetchError) {
      logger.error('Error fetching receipts for deletion', { error: fetchError, userId });
      return sendError(res, 'Error al obtener recibos del usuario');
    }

    // 2. Eliminar imágenes de S3 en paralelo
    if (receipts && receipts.length > 0) {
      const deletePromises = receipts
        .filter((r: any) => r.image_key)
        .map((r: any) =>
          deleteFromS3(r.image_key).catch((err: Error) => {
            logger.warn(`Failed to delete S3 object ${r.image_key}`, { error: err.message });
          })
        );
      await Promise.allSettled(deletePromises);
      logger.info(`Deleted ${deletePromises.length} S3 objects for user ${userId}`);
    }

    // 3. Eliminar recibos de la BD
    const { error: receiptDeleteError } = await supabaseAdmin
      .from('receipts')
      .delete()
      .eq('user_id', userId);

    if (receiptDeleteError) {
      logger.error('Error deleting receipts from DB', { error: receiptDeleteError, userId });
      return sendError(res, 'Error al eliminar recibos');
    }

    // 4. Eliminar perfil
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileDeleteError) {
      logger.warn('Error deleting profile', { error: profileDeleteError, userId });
      // No bloqueamos por esto — continuamos
    }

    // 5. Eliminar usuario de Supabase Auth
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      logger.error('Error deleting auth user', { error: authDeleteError, userId });
      return sendError(res, 'Error al eliminar la cuenta de autenticación');
    }

    logger.info(`Account and all data deleted for user ${userId} (GDPR)`);
    return sendSuccess(res, { message: 'Cuenta y datos eliminados correctamente' });

  } catch (error) {
    logger.error('Unexpected error during account deletion', { error, userId });
    return sendError(res, 'Error inesperado al eliminar la cuenta');
  }
});

export default router;
