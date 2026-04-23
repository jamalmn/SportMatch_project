import { useEffect, useRef, useState } from 'react';

export default function EventsSearchBar({ value, onChange, onViewChange, view }) {
  const [local, setLocal] = useState(value ?? '');
  const timerRef = useRef(null);

  useEffect(() => {
    setLocal(value ?? '');
  }, [value]);

  const handleChange = (e) => {
    const v = e.target.value;
    setLocal(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), 400);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className="flex items-center gap-3">
      {/* Search input */}
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sm-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
          />
        </svg>
        <input
          type="text"
          value={local}
          onChange={handleChange}
          placeholder="Buscar eventos..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-sm-gray-200 rounded-xl bg-white placeholder-sm-gray-400 text-sm-dark focus:outline-none focus:ring-2 focus:ring-sm-green-300 focus:border-sm-green-400 transition"
        />
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onViewChange('grid')}
          aria-label="Vista cuadrícula"
          className={`p-2 rounded-lg border transition-colors ${
            view === 'grid'
              ? 'bg-sm-dark text-white border-sm-dark'
              : 'bg-white text-sm-gray-500 border-sm-gray-200 hover:bg-sm-gray-50'
          }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 3h7v7H3zm0 11h7v7H3zm11-11h7v7h-7zm0 11h7v7h-7z" />
          </svg>
        </button>
        <button
          onClick={() => onViewChange('list')}
          aria-label="Vista lista"
          className={`p-2 rounded-lg border transition-colors ${
            view === 'list'
              ? 'bg-sm-dark text-white border-sm-dark'
              : 'bg-white text-sm-gray-500 border-sm-gray-200 hover:bg-sm-gray-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
