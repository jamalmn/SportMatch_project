import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SPORT_EMOJI from '../../utils/sportEmoji';

/* ── Sport background colours ────────────────────────────────────────────── */

const SPORT_BG = {
  futbol:      'bg-green-100',
  fútbol:      'bg-green-100',
  baloncesto:  'bg-orange-100',
  padel:       'bg-yellow-100',
  pádel:       'bg-yellow-100',
  voleibol:    'bg-sky-100',
  running:     'bg-red-100',
  ciclismo:    'bg-cyan-100',
  natacion:    'bg-blue-100',
  natación:    'bg-blue-100',
  otro:        'bg-sm-gray-100',
};

/* ── Estado badge ────────────────────────────────────────────────────────── */

const ESTADO_MAP = {
  activo:     { label: 'Activo',     classes: 'bg-sm-green-100 text-sm-green-700' },
  completo:   { label: 'Completo',   classes: 'bg-amber-100 text-amber-700' },
  finalizado: { label: 'Finalizado', classes: 'bg-sm-gray-100 text-sm-gray-500' },
  cancelado:  { label: 'Cancelado',  classes: 'bg-red-100 text-red-600' },
};

/* ── Occupancy bar ───────────────────────────────────────────────────────── */

function OccupancyBar({ inscritos, aforo }) {
  const pct   = aforo > 0 ? Math.min((inscritos / aforo) * 100, 100) : 0;
  const color = pct >= 100 ? 'bg-sm-gray-400'
              : pct >= 70  ? 'bg-amber-400'
              :               'bg-sm-green-500';

  return (
    <div className="space-y-1">
      <div className="h-1.5 rounded-full bg-sm-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-sm-gray-400">{inscritos}/{aforo} inscritos</p>
    </div>
  );
}

/* ── Date formatter ──────────────────────────────────────────────────────── */

function fmtDate(raw) {
  try {
    const str = format(new Date(raw), "EEE d MMM · HH:mm", { locale: es });
    return str.charAt(0).toUpperCase() + str.slice(1);
  } catch { return ''; }
}

/* ── Skeleton row ────────────────────────────────────────────────────────── */

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-sm-gray-100 animate-pulse last:border-0">
      <div className="w-10 h-10 bg-sm-gray-100 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2 pt-0.5">
        <div className="h-3.5 bg-sm-gray-100 rounded w-2/3" />
        <div className="h-3 bg-sm-gray-100 rounded w-1/3" />
        <div className="h-1.5 bg-sm-gray-100 rounded-full w-full" />
        <div className="h-3 bg-sm-gray-100 rounded w-1/4" />
      </div>
      <div className="w-14 h-5 bg-sm-gray-100 rounded-full shrink-0" />
    </div>
  );
}

/* ── Event row ───────────────────────────────────────────────────────────── */

function EventRow({ ev }) {
  const navigate  = useNavigate();
  const sport     = (ev.deporte ?? '').toLowerCase();
  const emoji     = SPORT_EMOJI[sport] ?? '🏅';
  const sportBg   = SPORT_BG[sport] ?? 'bg-sm-gray-100';
  const inscritos = ev.aforo_actual ?? 0;
  const { label: badgeLabel, classes: badgeClasses } =
    ESTADO_MAP[ev.estado] ?? { label: ev.estado, classes: 'bg-sm-gray-100 text-sm-gray-500' };

  const canEdit = ev.estado === 'activo';
  const showVer = ev.estado === 'finalizado';

  return (
    <div className="flex items-start gap-3 py-3 border-b border-sm-gray-100 last:border-0">
      {/* Sport icon */}
      <div
        className={`w-10 h-10 rounded-xl ${sportBg} flex items-center justify-center text-xl shrink-0`}
      >
        {emoji}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-1">
        <p
          className="text-sm font-semibold text-sm-dark truncate cursor-pointer hover:text-sm-green-600 transition-colors"
          onClick={() => navigate(`/events/${ev.id}`)}
        >
          {ev.titulo}
        </p>
        <p className="text-xs text-sm-gray-400">{fmtDate(ev.fecha_hora)}</p>
        <OccupancyBar inscritos={inscritos} aforo={ev.aforo_maximo} />
      </div>

      {/* Right: badge + action */}
      <div className="shrink-0 flex flex-col items-end gap-1.5 pt-0.5">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClasses}`}>
          {badgeLabel}
        </span>
        {canEdit && (
          <button
            type="button"
            onClick={() => navigate(`/events/${ev.id}/edit`)}
            className="text-xs font-semibold text-sm-green-600 hover:text-sm-green-700 transition-colors"
          >
            Editar
          </button>
        )}
        {showVer && (
          <button
            type="button"
            onClick={() => navigate(`/events/${ev.id}`)}
            className="text-xs font-semibold text-sm-gray-500 hover:text-sm-gray-700 transition-colors"
          >
            Ver
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */

export default function MyOrganizedEvents({ events, loading }) {
  const navigate = useNavigate();

  if (!loading && events.length === 0) return null;

  return (
    <div className="bg-white border border-sm-gray-200 rounded-2xl p-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-semibold text-sm-dark text-base">
          Eventos que organizo
        </h2>
        <button
          type="button"
          onClick={() => navigate('/events?organizador=me')}
          className="text-xs font-semibold text-sm-green-600 hover:text-sm-green-700 transition-colors"
        >
          Ver todos →
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div>
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : (
        <div>
          {events.map(ev => <EventRow key={ev.id} ev={ev} />)}
        </div>
      )}

      {/* Footer CTA */}
      {!loading && (
        <button
          type="button"
          onClick={() => navigate('/events/create')}
          className="mt-4 w-full py-2.5 rounded-full bg-sm-green-500 hover:bg-sm-green-600 text-white text-sm font-semibold transition-colors"
        >
          Crear nuevo evento
        </button>
      )}

    </div>
  );
}
