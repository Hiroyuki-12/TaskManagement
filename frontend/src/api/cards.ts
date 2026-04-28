import { apiClient } from './client';
import type { Card, ColumnId } from '../types/card';

export async function fetchCards(columnId?: ColumnId): Promise<Card[]> {
  const res = await apiClient.get<Card[]>('/cards', {
    params: columnId ? { columnId } : undefined,
  });
  return res.data;
}
