import { useNavigate } from 'react-router-dom';

export default function ActivitySummary({ user }) {
  const navigate = useNavigate();

  const rating  = Number(user?.rating_promedio ?? user?.valoracion_media ?? 0);
  const total   = user?.total_valoraciones ?? 0;
  const asist   = user?.eventos_asistidos   ?? 0;
  const organ   = user?.eventos_organizados ?? 0;

  const metrics = [
    {
      label:      'Eventos asistidos',
      value:      asist,
      valueClass: 'text-sm-green-600',
      icon:       '🏃',
    },
    {
      label:      'Organizados',
      value:      organ,
      valueClass: 'text-sm-dark',
      icon:       '📋',
    },
    {
      label:      'Valoración media',
      value:      (
        <span className="flex items-center justify-center gap-1">
          <span className="text-amber-500">★</span>
          {rating.toFixed(1)}
        </span>
      ),
      valueClass: 'text-amber-500',
      icon:       null,
    },
    {
      label:      'Valoraciones',
      value:      total,
      valueClass: 'text-sm-gray-500',
      icon:       '💬',
    },
  ];

  return (
    <div className="bg-white border border-sm-gray-200 rounded-2xl p-4 space-y-4">

      <h2 className="font-heading font-semibold text-sm-dark text-base">Mi actividad</h2>

      {/* 2×2 grid */}
      <div className="grid grid-cols-2 gap-2">
        {metrics.map(({ label, value, valueClass }) => (
          <div
            key={label}
            className="bg-sm-gray-50 rounded-xl p-3 flex flex-col items-center text-center"
          >
            <p className={`text-lg font-bold leading-none ${valueClass}`}>{value}</p>
            <p className="text-[11px] text-sm-gray-400 mt-1 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={() => navigate('/profile')}
        className="w-full py-2 rounded-full border border-sm-gray-200 text-sm font-semibold text-sm-gray-600 hover:bg-sm-gray-50 transition-colors"
      >
        Ver mi perfil completo
      </button>

    </div>
  );
}
