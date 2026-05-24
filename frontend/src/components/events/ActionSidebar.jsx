import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ProgressBar({ ocupados, aforo }) {
  const pct = aforo > 0 ? Math.min(100, Math.round((ocupados / aforo) * 100)) : 0;
  const color =
    pct >= 100 ? 'bg-red-500' :
    pct >= 70  ? 'bg-amber-400' :
                 'bg-sm-green-500';
  return (
    <div className="space-y-1.5">
      <div className="h-1.5 w-full rounded-full bg-sm-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-sm-gray-400 text-right">{pct}% ocupado</p>
    </div>
  );
}

function PlazasCard({ event, plazasLibres }) {
  const ocupados = event.aforo_maximo - plazasLibres;
  return (
    <div className="bg-white border border-sm-gray-200 rounded-2xl p-5 space-y-3">
      <div className="flex items-end gap-1">
        <span className="font-heading font-bold text-4xl text-sm-dark leading-none">
          {ocupados}
        </span>
        <span className="text-lg text-sm-gray-400 leading-none mb-0.5">
          /{event.aforo_maximo}
        </span>
        <span className="ml-auto text-xs text-sm-gray-400 leading-none mb-0.5">
          {plazasLibres} libre{plazasLibres !== 1 ? 's' : ''}
        </span>
      </div>
      <ProgressBar ocupados={ocupados} aforo={event.aforo_maximo} />
    </div>
  );
}

function ActionCard({ event, isOrganizer, isConfirmed, isWaiting, isPast, plazasLibres, hasAttended, onJoin, onLeave, onCancel, onRate, onFinalize }) {
  const navigate = useNavigate();

  let content;

  if (event.estado === 'cancelado') {
    content = (
      <p className="text-sm text-center text-red-500 font-medium py-1">
        Este evento ha sido cancelado
      </p>
    );
  } else if (event.estado === 'finalizado') {
    content = hasAttended ? (
      <button
        onClick={onRate}
        className="w-full py-2.5 rounded-full bg-sm-green-500 text-white text-sm font-semibold hover:bg-sm-green-600 transition-colors"
      >
        Valorar participantes
      </button>
    ) : (
      <p className="text-sm text-center text-sm-gray-400">Este evento ha finalizado</p>
    );
  } else if (isOrganizer) {
    content = isPast ? (
      <button
        onClick={onFinalize}
        className="w-full py-2.5 rounded-full bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
      >
        Finalizar evento
      </button>
    ) : (
      <div className="space-y-2">
        <button
          onClick={() => navigate(`/events/${event.id}/edit`)}
          className="w-full py-2.5 rounded-full border border-sm-gray-300 text-sm-dark text-sm font-semibold hover:bg-sm-gray-50 transition-colors"
        >
          Editar evento
        </button>
        <button
          onClick={onCancel}
          className="w-full py-2.5 rounded-full bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
        >
          Cancelar evento
        </button>
      </div>
    );
  } else if (isPast) {
    content = (
      <p className="text-sm text-center text-sm-gray-400">El evento ya ha terminado</p>
    );
  } else if (isConfirmed) {
    content = (
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 py-2.5 rounded-full bg-sm-green-100 text-sm-green-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-semibold">Estás inscrito</span>
        </div>
        <button
          onClick={onLeave}
          className="w-full py-2.5 rounded-full border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
        >
          Cancelar inscripción
        </button>
      </div>
    );
  } else if (isWaiting) {
    content = (
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 py-2.5 rounded-full bg-purple-100 text-purple-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold">En lista de espera</span>
        </div>
        <button
          onClick={onLeave}
          className="w-full py-2.5 rounded-full border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
        >
          Salir de la lista
        </button>
      </div>
    );
  } else if (plazasLibres > 0) {
    content = (
      <button
        onClick={onJoin}
        className="w-full py-2.5 rounded-full bg-sm-green-500 text-white text-sm font-semibold hover:bg-sm-green-600 transition-colors"
      >
        Unirse al evento
      </button>
    );
  } else {
    content = (
      <button
        onClick={onJoin}
        className="w-full py-2.5 rounded-full border border-sm-gray-300 text-sm-dark text-sm font-semibold hover:bg-sm-gray-50 transition-colors"
      >
        Apuntarse a lista de espera
      </button>
    );
  }

  return (
    <div className="bg-white border border-sm-gray-200 rounded-2xl p-5">
      {content}
    </div>
  );
}

function OrganizerCard({ organizador, organizadorId }) {
  const navigate = useNavigate();
  if (!organizador) return null;

  const inicial  = (organizador.nombre ?? '?').charAt(0).toUpperCase();
  const nombre   = [organizador.nombre, organizador.apellidos].filter(Boolean).join(' ');
  const rating   = organizador.rating_promedio ?? null;
  const eventos  = organizador.total_eventos ?? null;

  return (
    <button
      onClick={() => navigate(`/profile/${organizadorId}`)}
      className="w-full bg-white border border-sm-gray-200 rounded-2xl p-5 flex items-center gap-3 hover:shadow-sm transition-shadow text-left"
    >
      <div className="w-11 h-11 rounded-full bg-sm-green-200 text-sm-green-800 font-semibold text-base flex items-center justify-center shrink-0">
        {inicial}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-sm-dark truncate">{nombre}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {rating != null && Number(rating) > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-sm-gray-400">
              <svg className="w-3 h-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {Number(rating).toFixed(1)}
            </span>
          )}
          {eventos != null && (
            <span className="text-xs text-sm-gray-400">{eventos} evento{eventos !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
      <svg className="w-4 h-4 text-sm-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function ShareCard() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard access denied — silently ignore */
    }
  };

  const handleWhatsApp = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://wa.me/?text=${url}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white border border-sm-gray-200 rounded-2xl p-5 space-y-2">
      <p className="text-xs font-semibold text-sm-gray-500 uppercase tracking-wide mb-3">
        Compartir
      </p>
      <button
        onClick={handleCopy}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-sm-gray-200 text-sm text-sm-dark hover:bg-sm-gray-50 transition-colors"
      >
        {copied ? (
          <>
            <svg className="w-4 h-4 text-sm-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm-green-600 font-medium">¡Copiado!</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 text-sm-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copiar enlace
          </>
        )}
      </button>
      <button
        onClick={handleWhatsApp}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-sm-gray-200 text-sm text-sm-dark hover:bg-sm-gray-50 transition-colors"
      >
        <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        WhatsApp
      </button>
    </div>
  );
}

export default function ActionSidebar({
  event,
  isOrganizer,
  isConfirmed,
  isWaiting,
  isPast,
  plazasLibres,
  hasAttended,
  onJoin,
  onLeave,
  onCancel,
  onRate,
  onFinalize,
}) {
  return (
    <div className="space-y-4">
      <PlazasCard event={event} plazasLibres={plazasLibres} />

      <ActionCard
        event={event}
        isOrganizer={isOrganizer}
        isConfirmed={isConfirmed}
        isWaiting={isWaiting}
        isPast={isPast}
        plazasLibres={plazasLibres}
        hasAttended={hasAttended}
        onJoin={onJoin}
        onLeave={onLeave}
        onCancel={onCancel}
        onRate={onRate}
        onFinalize={onFinalize}
      />

      <OrganizerCard
        organizador={event.organizador}
        organizadorId={event.organizador_id}
      />

      <ShareCard />
    </div>
  );
}
