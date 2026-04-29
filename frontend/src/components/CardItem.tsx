import type { Card } from '../types/card';
import PriorityBadge from './PriorityBadge';

function isOverdue(dueDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

interface Props {
  card: Card;
  onClick?: (card: Card) => void;
}

export default function CardItem({ card, onClick }: Props) {
  return (
    <article
      className="cursor-pointer rounded-md border border-gray-200 bg-white p-3 shadow-sm hover:border-blue-300 hover:shadow"
      onClick={() => onClick?.(card)}
    >
      <h3 className="mb-2 text-sm font-medium text-gray-900">{card.title}</h3>
      <div className="flex items-center justify-between">
        <PriorityBadge priority={card.priority} />
        {card.dueDate && (
          <span
            className={`text-xs ${
              isOverdue(card.dueDate) ? 'font-semibold text-red-600' : 'text-gray-500'
            }`}
          >
            {card.dueDate}
          </span>
        )}
      </div>
    </article>
  );
}
