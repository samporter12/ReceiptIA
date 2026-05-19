import { STATUS_LABELS, STATUS_COLORS } from '../../utils/theme';
import type { ProcessingStatus } from '../../types';

interface BadgeProps {
  status: ProcessingStatus;
}

export default function Badge({ status }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
