import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';

function timeAgo(raw) {
  try {
    return formatDistanceToNow(new Date(raw), { addSuffix: true, locale: es });
  } catch { return ''; }
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 px-4 py-4 border-b border-sm-gray-100 animate-pulse last:border-0">
      <div className="w-2 h-2 rounded-full bg-sm-gray-200 shrink-0 mt-2" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-sm-gray-100 rounded w-full" />
        <div className="h-3 bg-sm-gray-100 rounded w-1/3" />
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const navigate = useNavigate();

  const [items, setItems]           = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    api.get('/api/notifications?limit=50')
      .then(res => {
        setItems(res.data.notifications ?? []);
        setUnreadCount(res.data.no_leidas ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setItems(prev => prev.map(n => ({ ...n, leida: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const handleClick = async (n) => {
    if (!n.leida) {
      try {
        await api.patch(`/api/notifications/${n.id}/read`);
        setItems(prev => prev.map(x => x.id === n.id ? { ...x, leida: true } : x));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch { /* ignore */ }
    }
    if (n.evento?.id) navigate(`/events/${n.evento.id}`);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-sm-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-bold text-2xl text-sm-dark">Notificaciones</h1>
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
                className="text-sm text-sm-gray-400 hover:text-sm-gray-600 transition-colors"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* List */}
          <div className="bg-white border border-sm-gray-200 rounded-2xl overflow-hidden">
            {loading ? (
              <>
                <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
              </>
            ) : items.length === 0 ? (
              <p className="text-sm text-sm-gray-400 text-center py-16">
                No tienes notificaciones.
              </p>
            ) : (
              items.map((n, idx) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className={`
                    w-full flex items-start gap-3 px-4 py-4 text-left transition-colors
                    ${idx < items.length - 1 ? 'border-b border-sm-gray-100' : ''}
                    ${!n.leida ? 'hover:bg-sm-green-50' : 'hover:bg-sm-gray-50 opacity-60'}
                  `}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 mt-2 ${
                    !n.leida ? 'bg-sm-green-500' : 'bg-sm-gray-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-sm-dark leading-snug">{n.mensaje}</p>
                    <p className="text-xs text-sm-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.leida && (
                    <span className="shrink-0 mt-1 text-[10px] font-semibold text-sm-green-600 bg-sm-green-50 px-1.5 py-0.5 rounded-full">
                      Nueva
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

        </div>
      </main>
    </>
  );
}
