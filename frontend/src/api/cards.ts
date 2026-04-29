import { apiClient } from './client';
import type { Card, ColumnId, Priority } from '../types/card';

export async function fetchCards(columnId?: ColumnId): Promise<Card[]> {
  const res = await apiClient.get<Card[]>('/cards', {
    params: columnId ? { columnId } : undefined,
  });
  return res.data;
}

export interface CardCreateInput {
  title: string;
  columnId: ColumnId;
  orderIndex: number;
  description?: string;
  priority?: Priority;
  dueDate?: string | null;
}

export async function createCard(input: CardCreateInput): Promise<Card> {
  const res = await apiClient.post<Card>('/cards', input);
  return res.data;
}
