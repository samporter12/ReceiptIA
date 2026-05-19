import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { receiptService } from '../../services/api';
import { Receipt, CATEGORIES } from '../../types';
import { CATEGORY_COLORS, formatCurrency, formatDate } from '../../utils/theme';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { ArrowLeft, Pencil, Trash2, Save, X, AlertCircle } from 'lucide-react';

export default function ReceiptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Receipt>>({});
  const [saveMsg, setSaveMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    receiptService.getReceipt(id).then((data) => {
      setReceipt(data);
      setEditData(data);
      if (data.needs_review) setEditMode(true);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!receipt) return;
    setSaving(true);
    try {
      const updated = await receiptService.updateReceipt(receipt.id, editData);
      setReceipt(updated);
      setEditMode(false);
      setSaveMsg('✅ Cambios guardados');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('❌ Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!receipt) return;
    setDeleting(true);
    try {
      await receiptService.deleteReceipt(receipt.id);
      navigate('/receipts');
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!receipt) return null;

  const categoryColor = CATEGORY_COLORS[receipt.category || 'Otro'] || '#AEB6BF';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/receipts')}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Recibos</span>
        </button>
        <h1 className="font-bold text-text-primary">Detalle del Recibo</h1>
        <div className="flex items-center gap-2">
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="p-2 text-primary hover:bg-primary-light rounded-xl transition-colors"
            >
              <Pencil size={18} />
            </button>
          )}
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 text-error hover:bg-error/10 rounded-xl transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Imagen */}
        {receipt.image_url && (
          <div className="rounded-2xl overflow-hidden border border-border bg-black">
            <img
              src={receipt.image_url}
              alt={receipt.merchant_name}
              className="w-full max-h-80 object-contain"
            />
          </div>
        )}

        {/* Alerta revisión */}
        {receipt.needs_review && (
          <div className="flex items-center gap-3 bg-warning/10 border border-warning/30 rounded-2xl p-4">
            <AlertCircle size={20} className="text-warning flex-shrink-0" />
            <p className="text-sm text-warning font-semibold">
              Este recibo necesita revisión manual
            </p>
          </div>
        )}

        {/* Save message */}
        {saveMsg && (
          <div className="bg-success/10 border border-success/20 rounded-xl px-4 py-3 text-success text-sm font-semibold">
            {saveMsg}
          </div>
        )}

        {/* Datos */}
        <div className="card space-y-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-text-primary">Datos extraídos</h2>
            <div className="flex items-center gap-2">
              <Badge status={receipt.processing_status} />
              {editMode ? (
                <button onClick={() => setEditMode(false)} className="p-1.5 text-text-muted hover:text-text-secondary rounded-lg">
                  <X size={16} />
                </button>
              ) : null}
            </div>
          </div>

          {editMode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Comercio</label>
                <input
                  type="text"
                  className="input-field"
                  value={editData.merchant_name || ''}
                  onChange={(e) => setEditData((p) => ({ ...p, merchant_name: e.target.value }))}
                  placeholder="Nombre del comercio"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Fecha (YYYY-MM-DD)</label>
                <input
                  type="date"
                  className="input-field"
                  value={editData.receipt_date ? editData.receipt_date.split('T')[0] : ''}
                  onChange={(e) => setEditData((p) => ({ ...p, receipt_date: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Total</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={editData.total_amount ?? ''}
                    onChange={(e) => setEditData((p) => ({ ...p, total_amount: parseFloat(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">IVA</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={editData.tax_amount ?? ''}
                    onChange={(e) => setEditData((p) => ({ ...p, tax_amount: parseFloat(e.target.value) }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Categoría</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditData((p) => ({ ...p, category: cat }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        editData.category === cat
                          ? 'bg-primary text-white border-primary'
                          : 'bg-background text-text-secondary border-border'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary w-full py-3 mt-2"
              >
                {saving ? <Spinner size="sm" color="text-white" /> : <><Save size={16} /> Guardar cambios</>}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {[
                { label: 'Comercio', value: receipt.merchant_name || '—' },
                { label: 'Fecha', value: receipt.receipt_date ? formatDate(receipt.receipt_date) : '—' },
                { label: 'Total', value: receipt.total_amount != null ? formatCurrency(receipt.total_amount, receipt.currency) : '—' },
                { label: 'IVA / Impuesto', value: receipt.tax_amount != null ? formatCurrency(receipt.tax_amount, receipt.currency) : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="py-3 flex justify-between items-center">
                  <span className="text-xs font-semibold text-text-muted uppercase">{label}</span>
                  <span className="text-sm font-semibold text-text-primary">{value}</span>
                </div>
              ))}

              {/* Categoría */}
              <div className="py-3 flex justify-between items-center">
                <span className="text-xs font-semibold text-text-muted uppercase">Categoría</span>
                {receipt.category ? (
                  <span
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: categoryColor + '20', color: categoryColor }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColor }} />
                    {receipt.category}
                  </span>
                ) : (
                  <span className="text-sm text-text-muted">Sin categoría</span>
                )}
              </div>

              {/* Confianza IA */}
              {receipt.confidence_score != null && (
                <div className="py-3">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs font-semibold text-text-muted uppercase">Confianza IA</span>
                    <span className="text-xs font-bold text-text-primary">
                      {Math.round(receipt.confidence_score * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${receipt.confidence_score > 0.8 ? 'bg-success' : 'bg-warning'}`}
                      style={{ width: `${receipt.confidence_score * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal confirmar eliminación */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-text-primary">Eliminar recibo</h3>
            <p className="text-text-secondary text-sm mt-2">
              ¿Estás seguro? Esta acción no se puede deshacer. El recibo y su imagen se eliminarán permanentemente.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 btn-secondary"
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 btn-danger"
                disabled={deleting}
              >
                {deleting ? <Spinner size="sm" /> : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
