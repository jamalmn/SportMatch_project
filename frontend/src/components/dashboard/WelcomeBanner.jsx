import { useNavigate } from 'react-router-dom';

function buildSubtitle(upcomingCount, unreadCount) {
  if (upcomingCount > 0 && unreadCount > 0) {
    return `Tienes ${upcomingCount} evento${upcomingCount !== 1 ? 's' : ''} próximo${upcomingCount !== 1 ? 's' : ''} y ${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer.`;
  }
  if (upcomingCount > 0) {
    return `Tienes ${upcomingCount} evento${upcomingCount !== 1 ? 's' : ''} próximo${upcomingCount !== 1 ? 's' : ''}.`;
  }
  return 'No tienes eventos próximos. ¿Buscamos algo?';
}

export default function WelcomeBanner({ user, upcomingCount = 0, unreadCount = 0 }) {
  const navigate  = useNavigate();
  const firstName = user?.nombre ?? 'deportista';
  const subtitle  = buildSubtitle(upcomingCount, unreadCount);

  return (
    <div className="bg-gradient-to-br from-sm-green-500 to-sm-green-600 rounded-2xl p-5 text-white">
      <h1 className="font-heading text-xl font-bold leading-tight">
        Buenas, {firstName} 👋
      </h1>
      <p className="text-sm opacity-80 mt-1.5 leading-snug">{subtitle}</p>

      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <button
          type="button"
          onClick={() => navigate('/events')}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-semibold hover:bg-white/30 transition-colors"
        >
          Explorar
        </button>
        <button
          type="button"
          onClick={() => navigate('/events/create')}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white text-sm-green-700 text-sm font-semibold hover:bg-sm-green-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Crear evento
        </button>
      </div>
    </div>
  );
}
