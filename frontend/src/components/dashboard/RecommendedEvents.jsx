import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../../services/api';
import SPORT_EMOJI from '../../utils/sportEmoji';
import EmptyState from '../common/EmptyState';

/* ── Status helper (same logic as EventCard) ─────────────────────────────── */

function getStatus(event) {
  const inscritos = event.aforo_actual ?? 0;
  const plazas    = event.aforo_maximo - inscritos;

  if (event.estado === 'completo' || event.estado === 'cancelado') {
    return { badge: { label: 'Lista espera', classes: 'bg-purple-100 text-purple-700' }, header: 'bg-purple-50', canJoin: false };
  }
  if (plazas <= 0) {
    return { badge: { label: 'Lleno',        classes: 'bg-red-100 text-red-700'       }, header: 'bg-red-50',    canJoin: false };
  }
  if (plazas <= 2) {
    return { badge: { label: 'Casi lleno',   classes: 'bg-amber-100 text-amber-700'  }, header: 'bg-amber-50',  canJoin: true  };
  }
  return   { badge: { label: 'Abierto',      classes: 'bg-sm-green-100 text-sm-green-700' }, header: 'bg-green-50', canJoin: true };
}

/* ── Compact event card ──────────────────────────────────────────────────── */

function RecommendedEventCard({ event, onJoin, isJoining }) {
  const navigate = useNavigate();
  const sportKey = (event.deporte ?? '').toLowerCase();
  const emoji    = SPORT_EMOJI[sportKey] ?? '🏅';
  const { badge, header, canJoin } = getStatus(event);

  let dateStr = '';
  try {
    const raw = format(new Date(event.fecha_hora), "d MMM · HH:mm", { locale: es });
    dateStr = raw.charAt(0).toUpperCase() + raw.slice(1);
  } catch { /* ignore */ }

  return (
    <div className="border border-sm-gray-200 rounded-2xl overflow-hidden flex flex-col bg-white">

      {/* Coloured header strip */}
      <div
        className={`${header} px-3 pt-3 pb-2 flex items-start justify-between gap-1.5 cursor-pointer`}
        onClick={() => navigate(`/events/${event.id}`)}
      >
        <span className="text-xl leading-none">{emoji}</span>
        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${badge.classes}`}>
          {badge.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-3 pb-3 flex flex-col gap-1 flex-1">
        <h3
          className="text-sm font-semibold text-sm-dark leading-snug line-clamp-2 mt-1 cursor-pointer hover:text-sm-green-600 transition-colors"
          onClick={() => navigate(`/events/${event.id}`)}
        >
          {event.titulo}
        </h3>

        {dateStr && (
          <p className="text-xs text-sm-gray-400">{dateStr}</p>
        )}
        {event.direccion && (
          <p className="text-xs text-sm-gray-400 truncate">{event.direccion}</p>
        )}

        <button
          type="button"
          disabled={!canJoin || isJoining}
          onClick={() => onJoin(event.id)}
          className="mt-auto pt-2.5 w-full py-1.5 rounded-full text-xs font-semibold transition-colors bg-sm-green-500 text-white hover:bg-sm-green-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isJoining ? 'Uniéndose…' : 'Unirse'}
        </button>
      </div>

    </div>
  );
}

/* ── Skeleton card ───────────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="border border-sm-gray-200 rounded-2xl bg-white overflow-hidden animate-pulse">
      <div className="h-12 bg-sm-gray-100" />
      <div className="px-3 py-3 space-y-2">
        <div className="h-3.5 bg-sm-gray-100 rounded w-3/4" />
        <div className="h-3 bg-sm-gray-100 rounded w-1/2" />
        <div className="h-3 bg-sm-gray-100 rounded w-2/3" />
        <div className="h-7 bg-sm-gray-100 rounded-full w-full mt-2" />
      </div>
    </div>
  );
}

/* ── Toast ───────────────────────────────────────────────────────────────── */

function Toast({ message }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-sm-dark text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-xl whitespace-nowrap pointer-events-none">
      {message}
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */

export default function RecommendedEvents({ events, loading, userSports = [] }) {
  const navigate  = useNavigate();

  const [displayEvents, setDisplayEvents] = useState(events);
  const [joiningId, setJoiningId]         = useState(null);
  const [toast, setToast]                 = useState(null);

  /* Keep displayEvents in sync when parent refreshes the list */
  useEffect(() => { setDisplayEvents(events); }, [events]);

  /* Auto-dismiss toast */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleJoin = async (eventId) => {
    setJoiningId(eventId);
    try {
      await api.post(`/api/events/${eventId}/inscriptions`);
      setDisplayEvents(prev => prev.filter(ev => ev.id !== eventId));
      setToast('¡Te has unido al evento!');
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'No se pudo unir al evento.';
      setToast(msg);
    } finally {
      setJoiningId(null);
    }
  };

  /* Empty case: no favourite sports → don't even try recommendations */
  if (!loading && (userSports.length === 0 || displayEvents.length === 0)) {
    return (
      <div className="bg-white border border-sm-gray-200 rounded-2xl p-5">
        <EmptyState
          title="Sin recomendaciones"
          description="Añade deportes favoritos a tu perfil para ver recomendaciones personalizadas."
          actionLabel="Editar perfil"
          onAction={() => navigate('/profile')}
        />
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast} />}

      <div className="bg-white border border-sm-gray-200 rounded-2xl p-5">

        {/* Header */}
        {!loading && (
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="font-heading font-semibold text-sm-dark text-base">
                Recomendados para ti
              </h2>
              <p className="text-xs text-sm-gray-400 mt-0.5">
                Basado en tus deportes favoritos
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/events')}
              className="text-xs font-semibold text-sm-green-600 hover:text-sm-green-700 transition-colors shrink-0 mt-0.5"
            >
              Ver todos →
            </button>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 mt-3">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            displayEvents.map(ev => (
              <RecommendedEventCard
                key={ev.id}
                event={ev}
                onJoin={handleJoin}
                isJoining={joiningId === ev.id}
              />
            ))
          )}
        </div>

      </div>
    </>
  );
}
