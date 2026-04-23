import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SPORT_EMOJI from '../../utils/sportEmoji';

const LEVEL_LABELS = {
  principiante: 'Principiante',
  intermedio:   'Intermedio',
  avanzado:     'Avanzado',
};

export default function EventPreviewCard({ titulo, sport, nivel, fecha, hora, direccion, aforoMaximo }) {
  const emoji      = SPORT_EMOJI[(sport ?? '').toLowerCase()] ?? '🏅';
  const nivelLabel = LEVEL_LABELS[nivel] ?? nivel;

  let dateStr = 'Fecha sin definir';
  if (fecha && hora) {
    try {
      const raw = format(new Date(`${fecha}T${hora}`), "EEE d MMM · HH:mm", { locale: es });
      dateStr = raw.charAt(0).toUpperCase() + raw.slice(1);
    } catch { /* keep placeholder */ }
  }

  return (
    <article className="bg-white border border-sm-gray-200 rounded-2xl overflow-hidden flex flex-col">
      <div className="bg-green-50 px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <span className="text-2xl leading-none">{emoji}</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sm-green-100 text-sm-green-700">
          Abierto
        </span>
      </div>

      <div className="px-4 pb-4 flex flex-col gap-2.5 flex-1">
        <h3 className="font-heading font-semibold text-sm-dark text-base leading-snug line-clamp-2 mt-1">
          {titulo || <span className="text-sm-gray-300">Título del evento</span>}
        </h3>

        <div className="flex items-center gap-1.5 text-sm text-sm-gray-500">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className={!fecha || !hora ? 'text-sm-gray-300 italic' : ''}>{dateStr}</span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-sm-gray-500">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className={`truncate ${!direccion ? 'text-sm-gray-300 italic' : ''}`}>
            {direccion || 'Ubicación sin definir'}
          </span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-sm-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-sm-green-200 text-sm-green-800 text-xs font-semibold flex items-center justify-center">
              ?
            </div>
            {nivelLabel && nivel && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-sm-gray-100 text-sm-gray-600">
                {nivelLabel}
              </span>
            )}
          </div>
          <span className="text-xs text-sm-gray-500">
            0 / {aforoMaximo || '—'}
            <span className="ml-1">plazas</span>
          </span>
        </div>
      </div>
    </article>
  );
}
