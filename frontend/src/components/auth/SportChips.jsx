const SPORTS = [
  { label: 'Fútbol',     emoji: '⚽' },
  { label: 'Baloncesto', emoji: '🏀' },
  { label: 'Pádel',      emoji: '🎾' },
  { label: 'Voleibol',   emoji: '🏐' },
  { label: 'Running',    emoji: '🏃' },
  { label: 'Ciclismo',   emoji: '🚴' },
  { label: 'Natación',   emoji: '🏊' },
  { label: 'Otro',       emoji: '🥊' },
];

export default function SportChips({ selected, onChange }) {
  const toggle = (label) => {
    onChange(
      selected.includes(label)
        ? selected.filter((s) => s !== label)
        : [...selected, label]
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {SPORTS.map(({ label, emoji }) => {
        const isSelected = selected.includes(label);
        return (
          <button
            key={label}
            type="button"
            onClick={() => toggle(label)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all duration-200 ${
              isSelected
                ? 'bg-sm-green-100 border-sm-green-500 text-sm-green-700 font-semibold'
                : 'bg-white border-sm-gray-200 text-sm-gray-600 hover:border-sm-gray-300'
            }`}
          >
            <span>{emoji}</span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
