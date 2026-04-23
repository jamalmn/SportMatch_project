import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../../services/api';

const POLL_MS = 30_000;

function timeAgo(raw) {
  try {
    return formatDistanceToNow(new Date(raw), { addSuffix: true, locale: es });
  } catch { return ''; }
}

/* ── Skeleton row ────────────────────────────────────────────────────────── */

function SkeletonRow() {
  return (
    <div className="flex items-start gap-2.5 px-4 py-3 border-b border-sm-gray-100 animate-pulse last:border-0">
      <div className="w-2 h-2 rounded-full bg-sm-gray-200 shrink-0 mt-1.5" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-sm-gray-100 rounded w-full" />
        <div className="h-3 bg-sm-gray-100 rounded w-1/3" />
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */

export default function NotificationsPanel({
  notifications: initialNotifications,
  loading,
  unreadCount,
  onUnreadChange,
}) {
  const navigate = useNavigate();

  const [items, setItems] = useState(initialNotifications ?? []);

  /* Sync when parent finishes loading */
  useEffect(() => { setItems(initialNotifications ?? []); }, [initialNotifications]);

  /* Polling */
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get('/api/notifications?limit=4');
        setItems(res.data.notifications ?? []);
        onUnreadChange?.(res.data.no_leidas ?? 0);
      } catch { /* ignore poll errors */ }
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [onUnreadChange]);

  /* Mark all read */
  const handleMarkAllRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setItems(prev => prev.map(n => ({ ...n, leida: true })));
      onUnreadChange?.(0);
    } catch { /* ignore */ }
  };

  /* Click row */
  const handleClick = async (n) => {
    if (!n.leida) {
      try {
        await api.patch(`/api/notifications/${n.id}/read`);
        setItems(prev => prev.map(x => x.id === n.id ? { ...x, leida: true } : x));
        const stillUnread = items.filter(x => !x.leida && x.id !== n.id).length;
        onUnreadChange?.(stillUnread);
      } catch { /* ignore */ }
    }
    if (n.evento?.id) navigate(`/events/${n.evento.id}`);
  };

  return (
    <div className="bg-white border border-sm-gray-200 rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <h2 className="font-heading font-semibold text-sm-dark text-base">
            Notificaciones
          </h2>
          {unreadCount > 0 && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white leading-none">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-xs text-sm-gray-400 hover:text-sm-gray-600 transition-colors"
          >
            Marcar leídas
          </button>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-sm-gray-400 text-center py-8 px-4">
          Sin notificaciones nuevas.
        </p>
      ) : (
        <div>
          {items.map((n, idx) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleClick(n)}
              className={`
                w-full flex items-start gap-2.5 px-4 py-3 text-left transition-colors
                ${idx < items.length - 1 ? 'border-b border-sm-gray-100' : ''}
                ${!n.leida ? 'hover:bg-sm-green-50' : 'hover:bg-sm-gray-50 opacity-50'}
              `}
            >
              {/* Unread dot */}
              <span
                className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                  !n.leida ? 'bg-sm-green-500' : 'bg-sm-gray-300'
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] leading-snug text-sm-dark line-clamp-2">
                  {n.mensaje}
                </p>
                <p className="text-[11px] text-sm-gray-400 mt-1">{timeAgo(n.created_at)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-sm-gray-100">
        <span className="text-[11px] text-sm-gray-400">Actualización cada 30 seg</span>
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="text-[11px] font-semibold text-sm-green-600 hover:text-sm-green-700 transition-colors"
        >
          Ver todas
        </button>
      </div>

    </div>
  );
}
