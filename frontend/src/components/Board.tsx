import { useEffect, useState } from 'react';
import { createCard, fetchCards, type CardCreateInput } from '../api/cards';
import { COLUMNS, type Card, type ColumnId } from '../types/card';
import CardEditModal from './CardEditModal';
import Column from './Column';

type CardsByColumn = Record<ColumnId, Card[]>;

const EMPTY: CardsByColumn = { todo: [], doing: [], done: [] };

export default function Board() {
  const [data, setData] = useState<CardsByColumn>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Card | null>(null);

  const handleCardSaved = (updated: Card) => {
    setData((prev) => ({
      ...prev,
      [updated.columnId]: prev[updated.columnId]
        .map((c) => (c.id === updated.id ? updated : c))
        .sort((a, b) => a.orderIndex - b.orderIndex),
    }));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.all(COLUMNS.map((c) => fetchCards(c.id)));
        if (cancelled) return;
        const next: CardsByColumn = { todo: [], doing: [], done: [] };
        COLUMNS.forEach((c, i) => {
          next[c.id] = [...results[i]].sort((a, b) => a.orderIndex - b.orderIndex);
        });
        setData(next);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'カードの取得に失敗しました');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = async (
    columnId: ColumnId,
    input: Omit<CardCreateInput, 'columnId' | 'orderIndex'>,
  ) => {
    try {
      const created = await createCard({
        ...input,
        columnId,
        orderIndex: data[columnId].length,
      });
      setData((prev) => ({
        ...prev,
        [columnId]: [...prev[columnId], created],
      }));
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'カードの登録に失敗しました';
      setError(msg);
      throw e instanceof Error ? e : new Error(msg);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">読み込み中…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="flex gap-4 overflow-x-auto">
        {COLUMNS.map((c) => (
          <Column
            key={c.id}
            columnId={c.id}
            label={c.label}
            cards={data[c.id]}
            onCreate={handleCreate}
            onCardClick={setEditing}
          />
        ))}
      </div>
      {editing && (
        <CardEditModal
          card={editing}
          onClose={() => setEditing(null)}
          onSaved={handleCardSaved}
        />
      )}
    </div>
  );
}
