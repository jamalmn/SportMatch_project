import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import EventCard from './EventCard';
import SkeletonCard from './SkeletonCard';
import EmptyState from '../common/EmptyState';
import SPORT_EMOJI from '../../utils/sportEmoji';

function EventListRow({ event }) {
  const navigate  = useNavigate();
  const sportKey  = (event.sport ?? event.deporte ?? '').toLowerCase();
  const emoji     = SPORT_EMOJI[sportKey] ?? '🏅';
  const inscritos = event.inscritos_confirmados ?? event.aforo_actual ?? 0;
  const plazas    = event.aforo_maximo - inscritos;
  const isFull    = event.estado === 'completo' || plazas <= 0;

  let dateStr = '';
  try {
    const raw = format(new Date(event.fecha_hora), "EEE d MMM · HH:mm", { locale: es });
    dateStr = raw.charAt(0).toUpperCase() + raw.slice(1);
  } catch {
    dateStr = event.fecha_hora ?? '';
  }

  return (
    <article
      onClick={() => navigate(`/events/${event.id}`)}
      className="bg-white border border-sm-gray-200 rounded-2xl px-4 py-3 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow duration-150"
    >
      {/* Emoji column */}
      <div className="w-12 h-12 shrink-0 rounded-xl bg-sm-gray-100 flex items-center justify-center text-2xl">
        {emoji}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-heading font-semibold text-sm-dark text-sm leading-snug truncate">
          {event.titulo}
        </h3>
        <p className="text-xs text-sm-gray-500 mt-0.5 truncate">
          {dateStr}
          {event.direccion ? ` · ${event.direccion}` : ''}
        </p>
      </div>

      {/* Plazas */}
      <div className="shrink-0 text-right">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          isFull ? 'bg-red-100 text-red-700' : 'bg-sm-green-100 text-sm-green-700'
        }`}>
          {isFull ? 'Lleno' : `${plazas} libre${plazas !== 1 ? 's' : ''}`}
        </span>
      </div>
    </article>
  );
}

export default function EventsGrid({ events, loading, view, onClearFilters }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!events.length) {
    return (
      <EmptyState
        title="No hay eventos"
        description="Prueba a cambiar los filtros o busca algo diferente."
        actionLabel="Limpiar filtros"
        onAction={onClearFilters}
      />
    );
  }

  if (view === 'list') {
    return (
      <div className="flex flex-col gap-3">
        {events.map((event) => <EventListRow key={event.id} event={event} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map((event) => <EventCard key={event.id} event={event} />)}
    </div>
  );
}
