import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import EventsSearchBar from '../components/events/EventsSearchBar';
import EventsFilters from '../components/events/EventsFilters';
import EventsGrid from '../components/events/EventsGrid';
import Pagination from '../components/common/Pagination';
import useEvents from '../hooks/useEvents';

const PAGE_SIZE = 6;

const EMPTY_FILTERS = {
  deporte: '',
  nivel:   '',
  estado:  '',
  fecha:   '',
  search:  '',
  page:    1,
};

function paramsToFilters(params) {
  return {
    deporte: params.get('deporte') ?? '',
    nivel:   params.get('nivel')   ?? '',
    estado:  params.get('estado')  ?? '',
    fecha:   params.get('fecha')   ?? '',
    search:  params.get('search')  ?? '',
    page:    Number(params.get('page') ?? 1),
  };
}

function filtersToParams(filters) {
  const p = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== '' && v !== undefined && !(k === 'page' && v === 1)) {
      p.set(k, String(v));
    }
  });
  return p;
}

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => paramsToFilters(searchParams));
  const [view, setView]       = useState('grid');

  const apiFilters = { ...filters, limit: PAGE_SIZE, offset: (filters.page - 1) * PAGE_SIZE };
  const { events, total, loading, error, refetch } = useEvents(apiFilters);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Keep URL in sync when filters change
  useEffect(() => {
    setSearchParams(filtersToParams(filters), { replace: true });
  }, [filters, setSearchParams]);

  const handleFiltersChange = useCallback((next) => setFilters(next), []);
  const handleSearchChange  = useCallback(
    (value) => setFilters((f) => ({ ...f, search: value, page: 1 })),
    []
  );
  const handlePageChange    = useCallback((page) => setFilters((f) => ({ ...f, page })), []);
  const handleClearFilters  = useCallback(() => setFilters(EMPTY_FILTERS), []);

  return (
    <div className="min-h-screen bg-sm-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-sm-dark">
              Todos los eventos
            </h1>
            {!loading && !error && (
              <p className="text-sm text-sm-gray-500 mt-1">
                {total} {total === 1 ? 'evento encontrado' : 'eventos encontrados'}
              </p>
            )}
          </div>
          <a
            href="/events/create"
            className="shrink-0 px-4 py-2.5 text-sm font-semibold text-white bg-sm-green-500 rounded-xl hover:bg-sm-green-600 transition-colors"
          >
            + Crear evento
          </a>
        </div>

        {/* Search + view toggle */}
        <div className="mb-4">
          <EventsSearchBar
            value={filters.search}
            onChange={handleSearchChange}
            view={view}
            onViewChange={setView}
          />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <EventsFilters filters={filters} onChange={handleFiltersChange} />
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={refetch}
              className="text-xs font-semibold underline ml-4 hover:text-red-800"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Grid / List */}
        {!error && (
          <>
            <EventsGrid
              events={events}
              loading={loading}
              view={view}
              onClearFilters={handleClearFilters}
            />

            <Pagination
              page={filters.page}
              totalPages={totalPages}
              onChange={handlePageChange}
            />
          </>
        )}
      </main>
    </div>
  );
}
