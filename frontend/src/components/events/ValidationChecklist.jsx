const CheckIcon = () => (
  <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
  </svg>
);

const PendingDot = () => (
  <span className="w-1.5 h-1.5 rounded-full bg-sm-gray-300 block" />
);

export default function ValidationChecklist({ watch, errors }) {
  const checks = [
    {
      label: 'Título (mín. 3 caracteres)',
      ok: (watch.titulo?.length ?? 0) >= 3,
    },
    {
      label: 'Descripción (mín. 10 caracteres)',
      ok: (watch.descripcion?.length ?? 0) >= 10,
    },
    {
      label: 'Deporte seleccionado',
      ok: Boolean(watch.sport),
    },
    {
      label: 'Fecha y hora',
      ok: Boolean(watch.fecha && watch.hora),
    },
    {
      label: 'Nivel seleccionado',
      ok: Boolean(watch.nivel),
    },
    {
      label: 'Ubicación marcada',
      ok: Boolean(watch.location?.lat && watch.location?.lng),
    },
  ];

  const done = checks.filter(c => c.ok).length;

  return (
    <div className="bg-white border border-sm-gray-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-sm-gray-400 uppercase tracking-wide">Completado</p>
        <span className={`text-xs font-bold ${done === checks.length ? 'text-sm-green-600' : 'text-sm-gray-400'}`}>
          {done}/{checks.length}
        </span>
      </div>
      <ul className="space-y-1.5">
        {checks.map(({ label, ok }) => (
          <li key={label} className="flex items-center gap-2 text-xs">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${ok ? 'bg-sm-green-100 text-sm-green-600' : 'bg-sm-gray-100 text-sm-gray-300'}`}>
              {ok ? <CheckIcon /> : <PendingDot />}
            </span>
            <span className={ok ? 'text-sm-dark' : 'text-sm-gray-400'}>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function useAllValid(watch) {
  return (
    (watch.titulo?.length ?? 0) >= 3 &&
    (watch.descripcion?.length ?? 0) >= 10 &&
    Boolean(watch.sport) &&
    Boolean(watch.fecha && watch.hora) &&
    Boolean(watch.nivel) &&
    Boolean(watch.location?.lat && watch.location?.lng)
  );
}
