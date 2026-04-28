import type { Card } from '../types/card';
import CardItem from './CardItem';

interface Props {
  label: string;
  cards: Card[];
}

export default function Column({ label, cards }: Props) {
  return (
    <section className="flex w-80 flex-shrink-0 flex-col rounded-lg bg-gray-100 p-3">
      <header className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-gray-700">
          {label} <span className="ml-1 text-gray-500">({cards.length})</span>
        </h2>
      </header>
      <div className="flex flex-col gap-2">
        {cards.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">カードがありません</p>
        ) : (
          cards.map((c) => <CardItem key={c.id} card={c} />)
        )}
      </div>
    </section>
  );
}
