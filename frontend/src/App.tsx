import Board from './components/Board';

export default function App() {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900">タスク管理アプリ</h1>
      </header>
      <main className="flex-1 overflow-auto p-6">
        <Board />
      </main>
    </div>
  );
}
