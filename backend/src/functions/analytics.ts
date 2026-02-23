import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabaseClient';
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
        });
    } catch (error) {
        logger.error('Error fetching dashboard data', { error });
        return sendError(res, 'Error obteniendo datos del dashboard');
    }
});

export default router;