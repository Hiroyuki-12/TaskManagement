import { useState } from 'react';
import type { CardCreateInput } from '../api/cards';
import type { Card, ColumnId } from '../types/card';
import CardItem from './CardItem';
import CardCreateForm from './CardCreateForm';

interface Props {
  columnId: ColumnId;
  label: string;
  cards: Card[];
  onCreate: (
    columnId: ColumnId,
    input: Omit<CardCreateInput, 'columnId' | 'orderIndex'>,
  ) => Promise<void>;
}

export default function Column({ columnId, label, cards, onCreate }: Props) {
  const [adding, setAdding] = useState(false);

  const handleSubmit = async (
    input: Omit<CardCreateInput, 'columnId' | 'orderIndex'>,
  ) => {
    await onCreate(columnId, input);
    setAdding(false);
  };

  return (
    <section className="flex w-80 flex-shrink-0 flex-col rounded-lg bg-gray-100 p-3">
      <header className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-gray-700">
          {label} <span className="ml-1 text-gray-500">({cards.length})</span>
        </h2>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
          >
            ＋ 追加
          </button>
        )}
      </header>
      <div className="flex flex-col gap-2">
        {cards.length === 0 && !adding ? (
          <p className="py-6 text-center text-sm text-gray-400">カードがありません</p>
        ) : (
          cards.map((c) => <CardItem key={c.id} card={c} />)
        )}
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
