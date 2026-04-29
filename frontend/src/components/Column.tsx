import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { CardCreateInput } from '../api/cards';
import type { Card, ColumnId } from '../types/card';
import CardItem from './CardItem';
import CardCreateForm from './CardCreateForm';

export const columnDroppableId = (columnId: ColumnId) => `column:${columnId}`;

interface Props {
  columnId: ColumnId;
  label: string;
  cards: Card[];
  onCreate: (
    columnId: ColumnId,
    input: Omit<CardCreateInput, 'columnId' | 'orderIndex'>,
  ) => Promise<void>;
  onCardClick?: (card: Card) => void;
  onSort?: (columnId: ColumnId) => Promise<void> | void;
  nextSortMode?: 'priority' | 'dueDate';
}

const SORT_LABEL: Record<'priority' | 'dueDate', string> = {
  priority: '優先度順',
  dueDate: '期日順',
};

export default function Column({
  columnId,
  label,
  cards,
  onCreate,
  onCardClick,
  onSort,
  nextSortMode,
}: Props) {
  const [adding, setAdding] = useState(false);
  const { setNodeRef } = useDroppable({ id: columnDroppableId(columnId) });

  const handleSubmit = async (
    input: Omit<CardCreateInput, 'columnId' | 'orderIndex'>,
  ) => {
    await onCreate(columnId, input);
    setAdding(false);
  };

  return (
    <section
      ref={setNodeRef}
      className="flex w-80 flex-shrink-0 flex-col rounded-lg bg-gray-100 p-3"
    >
      <header className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-gray-700">
          {label} <span className="ml-1 text-gray-500">({cards.length})</span>
        </h2>
        <div className="flex items-center gap-1">
          {onSort && cards.length > 1 && (
            <button
              type="button"
              onClick={() => onSort(columnId)}
              className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
              title={nextSortMode ? `${SORT_LABEL[nextSortMode]}に並び替え` : '並び替え'}
            >
              ⇅ {nextSortMode ? SORT_LABEL[nextSortMode] : '並び替え'}
            </button>
          )}
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
            >
              ＋ 追加
            </button>
          )}
        </div>
      </header>
      <div className="flex min-h-[40px] flex-col gap-2">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.length === 0 && !adding ? (
            <p className="py-6 text-center text-sm text-gray-400">カードがありません</p>
          ) : (
            cards.map((c) => <CardItem key={c.id} card={c} onClick={onCardClick} />)
          )}
        </SortableContext>
        {adding && (
          <CardCreateForm
            columnId={columnId}
            onSubmit={handleSubmit}
            onCancel={() => setAdding(false)}
          />
        )}
      </div>
    </section>
  );
}
