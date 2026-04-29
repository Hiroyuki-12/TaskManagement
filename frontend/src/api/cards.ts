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

export interface UpdateCardContentInput {
  title: string;
  description: string;
  priority: Priority;
  dueDate: string | null;
}

export async function updateCardContent(
  id: string,
  input: UpdateCardContentInput,
): Promise<Card> {
  const res = await apiClient.put<Card>(`/cards/${id}`, input);
  return res.data;
}

export interface UpdateCardPositionInput {
  columnId: ColumnId;
  orderIndex: number;
}

export async function updateCardPosition(
  id: string,
  input: UpdateCardPositionInput,
): Promise<Card> {
  const res = await apiClient.patch<Card>(`/cards/${id}/position`, input);
  return res.data;
}
