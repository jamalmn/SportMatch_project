import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import EventCard from '../events/EventCard';

function SkeletonCard() {
  return (
    <div className="bg-white border border-sm-gray-200 rounded-2xl p-4 flex flex-col gap-3 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="w-8 h-8 bg-sm-gray-200 rounded" />
        <div className="w-16 h-5 bg-sm-gray-200 rounded-full" />
      </div>
      <div className="h-4 bg-sm-gray-200 rounded w-3/4" />
      <div className="h-4 bg-sm-gray-200 rounded w-1/2" />
      <div className="h-4 bg-sm-gray-200 rounded w-2/3" />
      <div className="flex items-center justify-between pt-2 border-t border-sm-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-sm-gray-200 rounded-full" />
          <div className="w-20 h-4 bg-sm-gray-200 rounded-full" />
        </div>
        <div className="w-16 h-4 bg-sm-gray-200 rounded" />
      </div>
    </div>
  );
}

export default function EventsPreview() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/api/events', {
        params: { limit: 6, estado: 'abierto', sort_by: 'created_at', order: 'DESC' },
      })
      .then((res) => {
        setEvents(res.data.events ?? []);
      })
      .catch(() => {
        setError('No se pudieron cargar los eventos. Inténtalo más tarde.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-16 sm:py-24 bg-sm-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-sm font-semibold text-sm-green-600 uppercase tracking-wide mb-1">Eventos recientes</p>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-sm-dark">
              Actividades abiertas ahora
            </h2>
          </div>
          <Link
            to="/events"
            className="self-start sm:self-auto text-sm font-semibold text-sm-green-600 hover:text-sm-green-700 transition-colors"
          >
            Ver todos →
          </Link>
        </div>

        {/* Grid */}
        {error ? (
          <div className="text-center py-12 text-sm-gray-500">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : events.map((event) => <EventCard key={event.id} event={event} />)}
          </div>
        )}

        {/* CTA si no hay eventos */}
        {!loading && !error && events.length === 0 && (
          <div className="text-center py-12 text-sm-gray-500">
            No hay eventos abiertos por el momento.{' '}
            <Link to="/events/create" className="text-sm-green-600 font-semibold hover:underline">
              ¡Crea el primero!
            </Link>
          </div>
        )}

        {/* Botón centrado */}
        {!loading && events.length > 0 && (
          <div className="text-center mt-10">
            <Link
              to="/events"
              className="inline-block px-6 py-3 text-sm font-semibold border border-sm-gray-200 text-sm-gray-700 rounded-xl hover:bg-sm-gray-50 transition-colors"
            >
              Ver todos los eventos →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
