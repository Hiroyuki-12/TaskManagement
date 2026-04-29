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

/**
 * 部分更新リクエスト。送信したフィールドだけが更新される。
 * - 内容更新: title / description / priority / dueDate
 * - 位置更新: columnId / orderIndex
 * - 編集モーダルからのステータス変更は columnId と内容を同時に送る
 */
export interface UpdateCardInput {
  title?: string;
  description?: string;
  priority?: Priority;
  dueDate?: string | null;
  columnId?: ColumnId;
  orderIndex?: number;
}

export async function updateCard(id: string, input: UpdateCardInput): Promise<Card> {
  const res = await apiClient.patch<Card>(`/cards/${id}`, input);
  return res.data;
}

export async function deleteCard(id: string): Promise<void> {
  await apiClient.delete(`/cards/${id}`);
}
