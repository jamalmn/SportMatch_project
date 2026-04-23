import SPORT_EMOJI from '../../utils/sportEmoji';

export const SPORTS = [
  { key: 'futbol',     label: 'Fútbol' },
  { key: 'baloncesto', label: 'Baloncesto' },
  { key: 'padel',      label: 'Pádel' },
  { key: 'voleibol',   label: 'Voleibol' },
  { key: 'running',    label: 'Running' },
  { key: 'ciclismo',   label: 'Ciclismo' },
  { key: 'natacion',   label: 'Natación' },
  { key: 'otro',       label: 'Otro' },
];

export default function SportSelector({ value, onChange, error }) {
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SPORTS.map(({ key, label }) => {
          const selected = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                selected
                  ? 'bg-sm-green-50 border-sm-green-500 text-sm-green-800 font-semibold'
                  : 'bg-white border-sm-gray-200 text-sm-gray-600 hover:border-sm-green-300 hover:bg-sm-green-50'
              }`}
            >
              <span className="text-base leading-none">{SPORT_EMOJI[key] ?? '🏅'}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
