const STATS = [
  { value: '+500',  label: 'Eventos creados' },
  { value: '+12',   label: 'Deportes disponibles' },
  { value: '+2.000', label: 'Deportistas activos' },
  { value: '+20',   label: 'Ciudades' },
];

export default function StatsBar() {
  return (
    <section className="bg-sm-green-500 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-white text-center">
          {STATS.map(({ value, label }) => (
            <li key={label}>
              <p className="font-heading text-3xl font-bold">{value}</p>
              <p className="text-sm mt-1 text-sm-green-100">{label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
