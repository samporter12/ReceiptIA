import { Receipt } from '../../types';
import Badge from './Badge';
import { CATEGORY_COLORS, formatDate, formatCurrency } from '../../utils/theme';
import { AlertCircle } from 'lucide-react';

interface ReceiptCardProps {
  receipt: Receipt;
  onClick: () => void;
}

export default function ReceiptCard({ receipt, onClick }: ReceiptCardProps) {
  const categoryColor = CATEGORY_COLORS[receipt.category || 'Otro'] || '#AEB6BF';
  const initials = (receipt.merchant_name || '?').slice(0, 2).toUpperCase();

  return (
    <button
      onClick={onClick}
      className="w-full text-left card hover:shadow-md hover:border-primary/30 transition-all duration-200 flex items-center gap-4"
    >
      {/* Avatar / miniatura */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
        style={{ backgroundColor: categoryColor }}
      >
        {receipt.image_url ? (
          <img
            src={receipt.image_url}
            alt={receipt.merchant_name}
            className="w-12 h-12 rounded-xl object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          initials
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-text-primary truncate">
            {receipt.merchant_name || 'Sin comercio'}
          </p>
          <p className="font-bold text-text-primary whitespace-nowrap">
            {receipt.total_amount != null
              ? formatCurrency(receipt.total_amount, receipt.currency)
              : '—'}
          </p>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            {receipt.category && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: categoryColor + '20', color: categoryColor }}
              >
                {receipt.category}
              </span>
            )}
            {receipt.needs_review && (
              <AlertCircle size={14} className="text-warning" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge status={receipt.processing_status} />
            <span className="text-xs text-text-muted">
              {formatDate(receipt.created_at)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
