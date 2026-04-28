import type { Priority } from '../types/card';

const STYLES: Record<Priority, { label: string; className: string }> = {
  high: { label: '高', className: 'bg-red-100 text-red-700 ring-red-200' },
  medium: { label: '中', className: 'bg-yellow-100 text-yellow-800 ring-yellow-200' },
  low: { label: '低', className: 'bg-blue-100 text-blue-700 ring-blue-200' },
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const s = STYLES[priority];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${s.className}`}
    >
      {s.label}
    </span>
  );
}
