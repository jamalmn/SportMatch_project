const PROPS = [
  {
    emoji: '🎯',
    title: 'Filtra por nivel',
    description:
      'Principiante, intermedio o avanzado. Juega siempre con personas de tu mismo nivel.',
  },
  {
    emoji: '📍',
    title: 'Cerca de ti',
    description:
      'Busca eventos por radio de distancia. Nunca más desplazamientos innecesarios.',
  },
  {
    emoji: '🔔',
    title: 'Notificaciones en tiempo real',
    description:
      'Recibe alertas de confirmación, cancelaciones y nuevos eventos de tu deporte favorito.',
  },
  {
    emoji: '⭐',
    title: 'Sistema de valoraciones',
    description:
      'Valora a los organizadores y otros participantes. Construye tu reputación deportiva.',
  },
];

export default function ValueProps() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-sm-green-600 uppercase tracking-wide mb-1">
            ¿Por qué SportMatch?
          </p>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-sm-dark">
            Todo lo que necesitas para practicar deporte
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PROPS.map(({ emoji, title, description }) => (
            <div
              key={title}
              className="bg-sm-gray-50 border border-sm-gray-200 rounded-2xl p-6 flex flex-col gap-3"
            >
              <span className="text-3xl">{emoji}</span>
              <h3 className="font-heading font-semibold text-sm-dark">{title}</h3>
              <p className="text-sm text-sm-gray-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
