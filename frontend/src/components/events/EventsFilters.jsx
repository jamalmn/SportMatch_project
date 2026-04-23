const SPORTS = [
  { value: '', label: 'Todos' },
  { value: 'futbol', label: 'Fútbol' },
  { value: 'baloncesto', label: 'Baloncesto' },
  { value: 'padel', label: 'Pádel' },
  { value: 'voleibol', label: 'Voleibol' },
  { value: 'running', label: 'Running' },
  { value: 'ciclismo', label: 'Ciclismo' },
  { value: 'natacion', label: 'Natación' },
];

const LEVELS = [
  { value: '', label: 'Todos' },
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
];

const STATUS_CHIPS = [
  { value: '', label: 'Todos' },
  { value: 'abierto', label: 'Abiertos' },
  { value: 'completo', label: 'Llenos' },
];

const DATES = [
  { value: '', label: 'Cualquier fecha' },
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes', label: 'Este mes' },
];

const EMPTY_FILTERS = { deporte: '', nivel: '', estado: '', fecha: '', search: '', page: 1 };

const selectClass =
  'px-3 py-2 text-sm border border-sm-gray-200 rounded-xl bg-white text-sm-dark focus:outline-none focus:ring-2 focus:ring-sm-green-300 focus:border-sm-green-400 transition cursor-pointer';

export default function EventsFilters({ filters, onChange }) {
  const set = (key, value) => onChange({ ...filters, [key]: value, page: 1 });
  const hasActive =
    filters.deporte || filters.nivel || filters.estado || filters.fecha || filters.search;

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
      {/* Deporte */}
      <select
        value={filters.deporte}
        onChange={(e) => set('deporte', e.target.value)}
        className={selectClass}
      >
        {SPORTS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Nivel */}
      <select
        value={filters.nivel}
        onChange={(e) => set('nivel', e.target.value)}
        className={selectClass}
      >
        {LEVELS.map((l) => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </select>

      {/* Estado — chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {STATUS_CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => set('estado', chip.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
              filters.estado === chip.value
                ? 'bg-sm-green-100 border-sm-green-500 text-sm-green-800'
                : 'bg-white border-sm-gray-200 text-sm-gray-600 hover:border-sm-green-300'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Fecha */}
      <select
        value={filters.fecha}
        onChange={(e) => set('fecha', e.target.value)}
        className={selectClass}
      >
        {DATES.map((d) => (
          <option key={d.value} value={d.value}>{d.label}</option>
        ))}
      </select>

      {/* Limpiar */}
      {hasActive && (
        <button
          onClick={() => onChange(EMPTY_FILTERS)}
          className="text-xs font-semibold text-sm-gray-500 hover:text-sm-dark underline underline-offset-2 transition-colors"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}
