import { useNavigate } from 'react-router-dom';
import { differenceInCalendarDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import SPORT_EMOJI from '../../utils/sportEmoji';

/* ── Countdown chip ──────────────────────────────────────────────────────── */

function getCountdown(fechaHora) {
  const now  = new Date();
  const date = new Date(fechaHora);
  const days = differenceInCalendarDays(date, now);

  if (days <= 0) {
    return {
      label:       'hoy',
      chipClasses: 'bg-red-100 text-red-700',
      headerBg:    'bg-red-50',
    };
  }
  if (days === 1) {
    return {
      label:       'mañana',
      chipClasses: 'bg-amber-100 text-amber-700',
      headerBg:    'bg-amber-50',
    };
  }
  if (days < 7) {
    return {
      label:       `en ${days} días`,
      chipClasses: 'bg-sm-green-100 text-sm-green-700',
      headerBg:    'bg-green-50',
    };
  }
  let dateLabel = '';
  try {
    dateLabel = format(date, "d MMM", { locale: es });
  } catch { dateLabel = ''; }
  return {
    label:       dateLabel,
    chipClasses: 'bg-sm-gray-100 text-sm-gray-600',
    headerBg:    'bg-sm-gray-50',
  };
}

/* ── Date line ───────────────────────────────────────────────────────────── */

function fmtFull(raw) {
  try {
    const str = format(new Date(raw), "EEE d MMM · HH:mm", { locale: es });
    return str.charAt(0).toUpperCase() + str.slice(1);
  } catch { return ''; }
}

/* ── Component ───────────────────────────────────────────────────────────── */

export default function UpcomingEventCard({ inscription }) {
  const navigate = useNavigate();
  const ev       = inscription?.evento ?? {};
  const sport    = (ev.deporte ?? '').toLowerCase();
  const emoji    = SPORT_EMOJI[sport] ?? '🏅';

  const { label, chipClasses, headerBg } = getCountdown(ev.fecha_hora);

  return (
    <div className="w-[200px] shrink-0 rounded-2xl border border-sm-gray-200 bg-white overflow-hidden flex flex-col">

      {/* Coloured header */}
      <div className={`${headerBg} px-3 pt-3 pb-2 flex items-start justify-between gap-2`}>
        <span className="text-2xl leading-none">{emoji}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${chipClasses}`}>
          {label}
        </span>
      </div>

      {/* Body */}
      <div className="px-3 pb-3 flex flex-col gap-1.5 flex-1">
        <p className="text-sm font-semibold text-sm-dark leading-snug line-clamp-2 mt-1">
          {ev.titulo}
        </p>
        <p className="text-xs text-sm-gray-400">{fmtFull(ev.fecha_hora)}</p>
        {ev.direccion && (
          <p className="text-xs text-sm-gray-400 truncate">{ev.direccion}</p>
        )}

        <button
          type="button"
          onClick={() => navigate(`/events/${ev.id}`)}
          className="mt-auto pt-2 text-xs font-semibold text-sm-green-600 hover:text-sm-green-700 text-left transition-colors"
        >
          Ver detalles →
        </button>
      </div>

    </div>
  );
}
