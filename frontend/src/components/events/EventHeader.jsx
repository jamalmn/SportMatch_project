import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SPORT_EMOJI from '../../utils/sportEmoji';

const SPORT_BG = {
  futbol:     'bg-green-50',
  fútbol:     'bg-green-50',
  baloncesto: 'bg-orange-50',
  padel:      'bg-yellow-50',
  pádel:      'bg-yellow-50',
  voleibol:   'bg-blue-50',
  running:    'bg-teal-50',
  ciclismo:   'bg-lime-50',
  natacion:   'bg-sky-50',
  natación:   'bg-sky-50',
  otro:       'bg-sm-gray-50',
};

const ESTADO_BADGE = {
  abierto:    { label: 'Abierto',    classes: 'bg-sm-green-100 text-sm-green-700' },
  completo:   { label: 'Completo',   classes: 'bg-purple-100 text-purple-700' },
  cancelado:  { label: 'Cancelado',  classes: 'bg-red-100 text-red-700' },
  finalizado: { label: 'Finalizado', classes: 'bg-sm-gray-100 text-sm-gray-500' },
};

const NIVEL_BADGE = {
  principiante: { label: 'Principiante', classes: 'bg-blue-100 text-blue-700' },
  intermedio:   { label: 'Intermedio',   classes: 'bg-amber-100 text-amber-700' },
  avanzado:     { label: 'Avanzado',     classes: 'bg-red-100 text-red-700' },
};

function StarRating({ value }) {
  const rounded = Math.round((value ?? 0) * 2) / 2;
  return (
    <span className="flex items-center gap-0.5" aria-label={`Valoración: ${rounded} de 5`}>
      {[1, 2, 3, 4, 5].map(n => {
        const full  = rounded >= n;
        const half  = !full && rounded >= n - 0.5;
        return (
          <svg
            key={n}
            className={`w-3.5 h-3.5 ${full || half ? 'text-amber-400' : 'text-sm-gray-200'}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            {half ? (
              <>
                <defs>
                  <linearGradient id={`half-${n}`}>
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <path
                  fill={`url(#half-${n})`}
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                />
              </>
            ) : (
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            )}
          </svg>
        );
      })}
      <span className="ml-1 text-xs text-sm-gray-400">{Number(rounded).toFixed(1)}</span>
    </span>
  );
}

function InfoRow({ icon, label, children, last = false }) {
  return (
    <div className={`flex items-start gap-3 py-3 ${last ? '' : 'border-b border-sm-gray-50'}`}>
      <span className="mt-0.5 text-sm-gray-400 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-sm-gray-400 leading-none mb-0.5">{label}</p>
        <div className="text-sm text-sm-dark">{children}</div>
      </div>
    </div>
  );
}

function ProgressBar({ ocupados, aforo }) {
  const pct = aforo > 0 ? Math.min(100, Math.round((ocupados / aforo) * 100)) : 0;
  const color =
    pct >= 100 ? 'bg-red-500' :
    pct >= 70  ? 'bg-amber-400' :
                 'bg-sm-green-500';

  return (
    <div className="mt-1.5 space-y-1">
      <div className="h-1.5 w-full rounded-full bg-sm-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-sm-gray-400">{pct}% ocupado</p>
    </div>
  );
}

export default function EventHeader({ event }) {
  const sportKey  = (event.deporte ?? '').toLowerCase();
  const emoji     = SPORT_EMOJI[sportKey] ?? '🏅';
  const heroBg    = SPORT_BG[sportKey] ?? 'bg-sm-gray-50';
  const estadoBadge = ESTADO_BADGE[event.estado] ?? { label: event.estado, classes: 'bg-sm-gray-100 text-sm-gray-500' };
  const nivelBadge  = NIVEL_BADGE[event.nivel_requerido] ?? { label: event.nivel_requerido, classes: 'bg-sm-gray-100 text-sm-gray-500' };

  const org      = event.organizador ?? {};
  const inicial  = (org.nombre ?? '?').charAt(0).toUpperCase();
  const rating   = org.valoracion_media ?? org.rating ?? null;

  let fechaStr = '';
  try {
    const raw = format(new Date(event.fecha_hora), "EEEE d 'de' MMMM 'de' yyyy · HH:mm", { locale: es });
    fechaStr = raw.charAt(0).toUpperCase() + raw.slice(1);
  } catch {
    fechaStr = event.fecha_hora ?? '';
  }

  const distancia = event.distancia ?? event.distancia_km;

  return (
    <article className="bg-white border border-sm-gray-200 rounded-2xl overflow-hidden">
      {/* Hero */}
      <div className={`${heroBg} px-6 pt-6 pb-5`}>
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${estadoBadge.classes}`}>
            {estadoBadge.label}
          </span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/70 text-sm-gray-600 capitalize">
            {event.deporte}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${nivelBadge.classes}`}>
            {nivelBadge.label}
          </span>
        </div>

        {/* Emoji + título */}
        <div className="flex items-start gap-4">
          <span className="text-5xl leading-none select-none">{emoji}</span>
          <h1 className="font-heading font-bold text-2xl text-sm-dark leading-snug">
            {event.titulo}
          </h1>
        </div>

        {/* Organizador */}
        <div className="flex items-center gap-2.5 mt-4">
          <div className="w-8 h-8 rounded-full bg-sm-green-200 text-sm-green-800 text-sm font-semibold flex items-center justify-center shrink-0">
            {inicial}
          </div>
          <div>
            <p className="text-sm font-medium text-sm-dark leading-none">
              {org.nombre ?? 'Organizador'}
            </p>
            {rating != null && (
              <div className="mt-0.5">
                <StarRating value={rating} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info rows */}
      <div className="px-6 pb-2">
        <InfoRow
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          label="Fecha y hora"
        >
          {fechaStr}
        </InfoRow>

        <InfoRow
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Duración"
        >
          {event.duracion_minutos} minutos
        </InfoRow>

        <InfoRow
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          label="Ubicación"
        >
          <span>{event.direccion}</span>
          {distancia != null && (
            <span className="ml-1.5 text-xs text-sm-gray-400">
              · {Number(distancia).toFixed(1)} km
            </span>
          )}
        </InfoRow>

        <InfoRow
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          label="Aforo"
          last
        >
          <span>
            {event.aforo_actual} de {event.aforo_maximo} plazas ocupadas
          </span>
          <ProgressBar ocupados={event.aforo_actual} aforo={event.aforo_maximo} />
        </InfoRow>
      </div>
    </article>
  );
}
