import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../../services/api';
import SPORT_EMOJI from '../../utils/sportEmoji';
import EmptyState from '../common/EmptyState';

const LIMIT = 5;

/* ── Badge helpers ───────────────────────────────────────────────────────── */

const EVENT_BADGE = {
  activo:     { label: 'Activo',     classes: 'bg-sm-green-100 text-sm-green-700' },
  completo:   { label: 'Completo',   classes: 'bg-amber-100 text-amber-700' },
  finalizado: { label: 'Finalizado', classes: 'bg-sm-gray-100 text-sm-gray-500' },
  cancelado:  { label: 'Cancelado',  classes: 'bg-red-100 text-red-600' },
};

const INSCRIPTION_BADGE = {
  confirmado:   { label: 'Confirmado',   classes: 'bg-sm-green-100 text-sm-green-700' },
  lista_espera: { label: 'Lista espera', classes: 'bg-purple-100 text-purple-700' },
  cancelado:    { label: 'Cancelado',    classes: 'bg-red-100 text-red-600' },
};

function Badge({ map, value }) {
  const entry = map[value] ?? { label: value, classes: 'bg-sm-gray-100 text-sm-gray-500' };
  return (
    <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${entry.classes}`}>
      {entry.label}
    </span>
  );
}

/* ── Date formatter ──────────────────────────────────────────────────────── */

function fmtDate(raw) {
  try {
    const str = format(new Date(raw), "EEE d MMM · HH:mm", { locale: es });
    return str.charAt(0).toUpperCase() + str.slice(1);
  } catch {
    return raw ?? '';
  }
}

/* ── Skeleton row ────────────────────────────────────────────────────────── */

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="w-8 h-8 rounded-xl bg-sm-gray-100 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-sm-gray-100 rounded w-2/3" />
        <div className="h-3 bg-sm-gray-100 rounded w-1/3" />
      </div>
      <div className="h-5 w-16 bg-sm-gray-100 rounded-full shrink-0" />
    </div>
  );
}

/* ── Row: participated ───────────────────────────────────────────────────── */

function ParticipatedRow({ inscription, onClick }) {
  const evento = inscription.evento ?? {};
  const sport  = (evento.deporte ?? '').toLowerCase();
  const emoji  = SPORT_EMOJI[sport] ?? '🏅';
  const badge  = evento.estado === 'finalizado'
    ? EVENT_BADGE.finalizado
    : INSCRIPTION_BADGE[inscription.estado] ?? INSCRIPTION_BADGE.confirmado;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-sm-gray-50 transition-colors text-left"
    >
      <span className="w-8 h-8 rounded-xl bg-sm-green-50 flex items-center justify-center text-lg shrink-0">
        {emoji}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-sm-dark truncate">{evento.titulo}</p>
        <p className="text-xs text-sm-gray-400 truncate mt-0.5">
          {fmtDate(evento.fecha_hora)}
          {evento.direccion && ` · ${evento.direccion}`}
        </p>
      </div>
      <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${badge.classes}`}>
        {badge.label}
      </span>
    </button>
  );
}

/* ── Row: organized ──────────────────────────────────────────────────────── */

function OrganizedRow({ event, isOwnProfile, onClick, onEdit }) {
  const sport = (event.deporte ?? '').toLowerCase();
  const emoji = SPORT_EMOJI[sport] ?? '🏅';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-sm-gray-50 transition-colors text-left cursor-pointer"
    >
      <span className="w-8 h-8 rounded-xl bg-sm-green-50 flex items-center justify-center text-lg shrink-0">
        {emoji}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-sm-dark truncate">{event.titulo}</p>
        <p className="text-xs text-sm-gray-400 truncate mt-0.5">
          {fmtDate(event.fecha_hora)}
          {` · ${event.aforo_actual ?? 0}/${event.aforo_maximo} inscritos`}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge map={EVENT_BADGE} value={event.estado} />
        {isOwnProfile && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="text-xs text-sm-green-600 font-semibold hover:underline"
          >
            Editar
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */

export default function EventHistoryList({ type, userId, isOwnProfile }) {
  const navigate = useNavigate();

  const [items, setItems]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    let request;
    if (type === 'participated') {
      if (!isOwnProfile) {
        setItems([]);
        setTotal(0);
        setLoading(false);
        return;
      }
      request = api.get(`/api/users/me/inscriptions?estado=confirmed&page=1&limit=${LIMIT}`);
    } else {
      request = api.get(`/api/users/${userId}/events?page=1&limit=${LIMIT}`);
    }

    request
      .then((res) => {
        if (type === 'participated') {
          setItems(res.data.inscriptions ?? []);
          setTotal(res.data.total ?? 0);
        } else {
          setItems(res.data.events ?? []);
          setTotal(res.data.total ?? 0);
        }
      })
      .catch(() => setError('No se pudieron cargar los eventos.'))
      .finally(() => setLoading(false));
  }, [type, userId, isOwnProfile]);

  if (loading) {
    return (
      <div className="divide-y divide-sm-gray-100">
        {Array.from({ length: 3 }, (_, i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-500 text-center py-6">{error}</p>
    );
  }

  if (items.length === 0) {
    const emptyProps = type === 'participated'
      ? {
          title: isOwnProfile ? 'Sin eventos participados' : 'Historial privado',
          description: isOwnProfile
            ? 'Únete a eventos para verlos aquí.'
            : 'El historial de participación es privado.',
        }
      : {
          title: 'Sin eventos organizados',
          description: isOwnProfile
            ? 'Crea tu primer evento para verlo aquí.'
            : 'Este usuario aún no ha organizado eventos.',
          actionLabel: isOwnProfile ? 'Crear evento' : undefined,
          onAction: isOwnProfile ? () => navigate('/events/create') : undefined,
        };

    return <EmptyState {...emptyProps} />;
  }

  const seeAllPath = type === 'participated'
    ? '/events'
    : `/events?organizador=${userId}`;

  return (
    <div>
      <div className="divide-y divide-sm-gray-100">
        {type === 'participated'
          ? items.map((ins) => (
              <ParticipatedRow
                key={ins.id}
                inscription={ins}
                onClick={() => navigate(`/events/${ins.evento?.id}`)}
              />
            ))
          : items.map((ev) => (
              <OrganizedRow
                key={ev.id}
                event={ev}
                isOwnProfile={isOwnProfile}
                onClick={() => navigate(`/events/${ev.id}`)}
                onEdit={() => navigate(`/events/${ev.id}/edit`)}
              />
            ))
        }
      </div>

      {total > LIMIT && (
        <div className="px-4 py-3 border-t border-sm-gray-100">
          <button
            type="button"
            onClick={() => navigate(seeAllPath)}
            className="text-sm font-semibold text-sm-green-600 hover:text-sm-green-700 transition-colors"
          >
            Ver todos ({total}) →
          </button>
        </div>
      )}
    </div>
  );
}
