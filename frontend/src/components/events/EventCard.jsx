import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SPORT_EMOJI from '../../utils/sportEmoji';

const LEVEL_LABELS = {
  principiante: 'Principiante',
  intermedio:   'Intermedio',
  avanzado:     'Avanzado',
};

function getStatus(event) {
  const inscritos = event.inscritos_confirmados ?? event.aforo_actual ?? 0;
  const plazas = event.aforo_maximo - inscritos;

  if (event.estado === 'completo' || event.estado === 'cancelado') {
    return {
      plazas,
      badge:  { label: 'Lista espera', classes: 'bg-purple-100 text-purple-700' },
      header: 'bg-purple-50',
    };
  }
  if (plazas <= 0) {
    return {
      plazas: 0,
      badge:  { label: 'Lleno', classes: 'bg-red-100 text-red-700' },
      header: 'bg-red-50',
    };
  }
  if (plazas <= 2) {
    return {
      plazas,
      badge:  { label: 'Casi lleno', classes: 'bg-amber-100 text-amber-700' },
      header: 'bg-amber-50',
    };
  }
  return {
    plazas,
    badge:  { label: 'Abierto', classes: 'bg-sm-green-100 text-sm-green-700' },
    header: 'bg-green-50',
  };
}

export default function EventCard({ event }) {
  const navigate  = useNavigate();
  const sportKey  = (event.sport ?? event.deporte ?? '').toLowerCase();
  const emoji     = SPORT_EMOJI[sportKey] ?? '🏅';
  const { plazas, badge, header } = getStatus(event);
  const inscritos = event.inscritos_confirmados ?? event.aforo_actual ?? 0;
  const initial   = event.organizador?.nombre?.charAt(0).toUpperCase() ?? '?';
  const distancia = event.distancia ?? event.distancia_km;

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
      className="bg-white border border-sm-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-150 flex flex-col"
    >
      {/* Colored header strip */}
      <div className={`${header} px-4 pt-4 pb-3 flex items-start justify-between gap-2`}>
        <span className="text-2xl leading-none">{emoji}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.classes}`}>
          {badge.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 pb-4 flex flex-col gap-2.5 flex-1">
        {/* Título */}
        <h3 className="font-heading font-semibold text-sm-dark text-base leading-snug line-clamp-2 mt-1">
          {event.titulo}
        </h3>

        {/* Fecha */}
        <div className="flex items-center gap-1.5 text-sm text-sm-gray-500">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{dateStr}</span>
        </div>

        {/* Ubicación */}
        <div className="flex items-center gap-1.5 text-sm text-sm-gray-500">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{event.direccion}</span>
          {distancia != null && (
            <span className="shrink-0 text-xs text-sm-gray-400">
              · {Number(distancia).toFixed(1)} km
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-sm-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-sm-green-200 text-sm-green-800 text-xs font-semibold flex items-center justify-center">
              {initial}
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-sm-gray-100 text-sm-gray-600">
              {LEVEL_LABELS[event.nivel_requerido] ?? event.nivel_requerido}
            </span>
          </div>
          <span className="text-xs text-sm-gray-500">
            {inscritos}/{event.aforo_maximo}
            <span className="ml-1">plazas</span>
          </span>
        </div>
      </div>
    </article>
  );
}
