import { useEffect, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  createCard,
  fetchCards,
  updateCardPosition,
  type CardCreateInput,
} from '../api/cards';
import { COLUMNS, type Card, type ColumnId } from '../types/card';
import CardEditModal from './CardEditModal';
import Column from './Column';

const COLUMN_DROPPABLE_PREFIX = 'column:';

function findColumnOf(data: Record<ColumnId, Card[]>, cardId: string): ColumnId | null {
  for (const c of COLUMNS) {
    if (data[c.id].some((x) => x.id === cardId)) return c.id;
  }
  return null;
}

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const refetchAll = async () => {
    const results = await Promise.all(COLUMNS.map((c) => fetchCards(c.id)));
    const next: CardsByColumn = { todo: [], doing: [], done: [] };
    COLUMNS.forEach((c, i) => {
      next[c.id] = [...results[i]].sort((a, b) => a.orderIndex - b.orderIndex);
    });
    setData(next);
  };

  const resolveTargetColumn = (overId: string, current: CardsByColumn): ColumnId | null => {
    if (overId.startsWith(COLUMN_DROPPABLE_PREFIX)) {
      return overId.slice(COLUMN_DROPPABLE_PREFIX.length) as ColumnId;
    }
    return findColumnOf(current, overId);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const cardId = String(active.id);
    const overId = String(over.id);
    if (cardId === overId) return;

    setData((prev) => {
      const fromColumn = findColumnOf(prev, cardId);
      if (!fromColumn) return prev;
      const toColumn = resolveTargetColumn(overId, prev);
      if (!toColumn || fromColumn === toColumn) return prev;

      const card = prev[fromColumn].find((c) => c.id === cardId);
      if (!card) return prev;
      const fromList = prev[fromColumn].filter((c) => c.id !== cardId);
      const toList = [...prev[toColumn]];
      const insertAt = overId.startsWith(COLUMN_DROPPABLE_PREFIX)
        ? toList.length
        : Math.max(0, toList.findIndex((c) => c.id === overId));
      toList.splice(insertAt, 0, { ...card, columnId: toColumn });
      return { ...prev, [fromColumn]: fromList, [toColumn]: toList };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const cardId = String(active.id);
    const overId = String(over.id);

    const toColumn = findColumnOf(data, cardId);
    if (!toColumn) return;
    const currentIndex = data[toColumn].findIndex((c) => c.id === cardId);
    if (currentIndex < 0) return;

    let targetIndex: number;
    if (cardId === overId || overId.startsWith(COLUMN_DROPPABLE_PREFIX)) {
      targetIndex = currentIndex;
    } else {
      const overCol = findColumnOf(data, overId);
      const overIdx = overCol === toColumn ? data[toColumn].findIndex((c) => c.id === overId) : -1;
      targetIndex = overIdx >= 0 ? overIdx : currentIndex;
    }

    const prevData = data;
    if (targetIndex !== currentIndex) {
      setData((p) => {
        const next = [...p[toColumn]];
        const [moved] = next.splice(currentIndex, 1);
        next.splice(targetIndex, 0, moved);
        return { ...p, [toColumn]: next };
      });
    }

    try {
      await updateCardPosition(cardId, { columnId: toColumn, orderIndex: targetIndex });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'カードの移動に失敗しました');
      setData(prevData);
      void refetchAll();
    }
  };

  const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const SORT_MODES = ['priority', 'dueDate'] as const;
  type SortMode = (typeof SORT_MODES)[number];

  const [sortMode, setSortMode] = useState<Record<ColumnId, SortMode>>({
    todo: 'priority',
    doing: 'priority',
    done: 'priority',
  });

  const sortCards = (cards: Card[], mode: SortMode): Card[] => {
    return [...cards].sort((a, b) => {
      if (mode === 'priority') {
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      }
      const av = a.dueDate;
      const bv = b.dueDate;
      if (!av && !bv) return 0;
      if (!av) return 1;
      if (!bv) return -1;
      return av < bv ? -1 : av > bv ? 1 : 0;
    });
  };

  const handleSort = async (columnId: ColumnId) => {
    const mode = sortMode[columnId];
    const sorted = sortCards(data[columnId], mode);
    const prevData = data;
    setData((p) => ({ ...p, [columnId]: sorted }));
    setSortMode((prev) => {
      const idx = SORT_MODES.indexOf(prev[columnId]);
      const next = SORT_MODES[(idx + 1) % SORT_MODES.length];
      return { ...prev, [columnId]: next };
    });
    try {
      for (let i = 0; i < sorted.length; i++) {
        await updateCardPosition(sorted[i].id, { columnId, orderIndex: i });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'カードの並び替えに失敗しました');
      setData(prevData);
      void refetchAll();
    }
  };

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
      <DndContext sensors={sensors} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto">
          {COLUMNS.map((c) => (
            <Column
              key={c.id}
              columnId={c.id}
              label={c.label}
              cards={data[c.id]}
              onCreate={handleCreate}
              onCardClick={setEditing}
              onSort={handleSort}
              nextSortMode={sortMode[c.id]}
            />
          ))}
        </div>
      </DndContext>
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
