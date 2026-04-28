export type ColumnId = 'todo' | 'doing' | 'done';
export type Priority = 'high' | 'medium' | 'low';

export interface Card {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string | null;
  columnId: ColumnId;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export const COLUMNS: { id: ColumnId; label: string }[] = [
  { id: 'todo', label: '未着手' },
  { id: 'doing', label: '作業中' },
  { id: 'done', label: '完了' },
];
