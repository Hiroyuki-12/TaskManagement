import { useState, type FormEvent } from 'react';
import type { CardCreateInput } from '../api/cards';
import type { ColumnId, Priority } from '../types/card';

interface Props {
  columnId: ColumnId;
  onSubmit: (input: Omit<CardCreateInput, 'columnId' | 'orderIndex'>) => Promise<void>;
  onCancel: () => void;
}

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

export default function CardCreateForm({ onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('タイトルは必須です');
      return;
    }
    if (trimmed.length > 100) {
      setError('タイトルは100文字以内で入力してください');
      return;
    }
    if (description.length > 1000) {
      setError('説明は1000文字以内で入力してください');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        title: trimmed,
        description: description.trim() ? description : undefined,
        priority,
        dueDate: dueDate ? dueDate : null,
      });
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '登録に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-md border border-gray-200 bg-white p-2 shadow-sm"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="タイトル (必須)"
        maxLength={100}
        required
        autoFocus
        className="rounded border border-gray-300 px-2 py-1 text-sm"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="説明 (任意)"
        maxLength={1000}
        rows={2}
        className="resize-y rounded border border-gray-300 px-2 py-1 text-sm"
      />
      <div className="flex gap-2">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? '登録中…' : '登録'}
        </button>
      </div>
    </form>
  );
}
