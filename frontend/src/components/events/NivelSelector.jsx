export const NIVELES = [
  {
    key:   'principiante',
    label: 'Principiante',
    emoji: '🌱',
    desc:  'Para quienes empiezan',
  },
  {
    key:   'intermedio',
    label: 'Intermedio',
    emoji: '⚡',
    desc:  'Experiencia básica',
  },
  {
    key:   'avanzado',
    label: 'Avanzado',
    emoji: '🏆',
    desc:  'Nivel competitivo',
  },
];

export default function NivelSelector({ value, onChange, error }) {
  return (
    <div>
      <div className="flex gap-3">
        {NIVELES.map(({ key, label, emoji, desc }) => {
          const selected = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl border transition-colors ${
                selected
                  ? 'bg-sm-green-50 border-sm-green-500'
                  : 'bg-white border-sm-gray-200 hover:border-sm-green-300 hover:bg-sm-green-50'
              }`}
            >
              <span className="text-xl leading-none">{emoji}</span>
              <span className={`text-xs font-semibold leading-none mt-0.5 ${selected ? 'text-sm-green-800' : 'text-sm-dark'}`}>
                {label}
              </span>
              <span className="text-xs text-sm-gray-400 leading-snug text-center">{desc}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
