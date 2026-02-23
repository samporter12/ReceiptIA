import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../services/supabaseClient';
import { sendError } from '../utils/apiResponse';
import logger from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        plan: 'free' | 'pro';
        receipts_count_this_month: number;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      sendError(res, 'Token de autorización requerido', 401);
      return;
    }

    const token = authHeader.split(' ')[1];

    // Usar supabaseAdmin para verificar el token
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      sendError(res, 'Token inválido o expirado', 401);
      return;
    }

    // Buscar perfil
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('plan, receipts_count_this_month')
      .eq('id', user.id)
      .single();

    // Si no existe el perfil, crearlo automáticamente
    if (profileError || !profile) {
      logger.warn(`Perfil no encontrado para ${user.email}, creando...`);

      await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          plan: 'free',
          receipts_count_this_month: 0,
        });

      req.user = {
        id: user.id,
        email: user.email!,
        plan: 'free',
        receipts_count_this_month: 0,
      };
    } else {
      req.user = {
        id: user.id,
        email: user.email!,
        plan: profile.plan,
        receipts_count_this_month: profile.receipts_count_this_month,
      };
    }

    next();
  } catch (error) {
    logger.error('Auth middleware error', { error });
    sendError(res, 'Error de autenticación', 500);
  }
};

export const checkPlanLimits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user!;
  if (user.plan === 'free' && user.receipts_count_this_month >= 15) {
    sendError(res, 'Has alcanzado el límite de 15 recibos del plan gratuito.', 403);
    return;
  }
  next();
};