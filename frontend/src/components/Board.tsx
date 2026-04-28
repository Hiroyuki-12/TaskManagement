import { useEffect, useState } from 'react';
import { fetchCards } from '../api/cards';
import { COLUMNS, type Card, type ColumnId } from '../types/card';
import Column from './Column';

type CardsByColumn = Record<ColumnId, Card[]>;

const EMPTY: CardsByColumn = { todo: [], doing: [], done: [] };

export default function Board() {
  const [data, setData] = useState<CardsByColumn>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <Column key={c.id} label={c.label} cards={data[c.id]} />
        ))}
      </div>
    </div>
  );
}
