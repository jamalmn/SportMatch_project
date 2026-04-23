const STEPS = [
  {
    number: '01',
    emoji: '🔍',
    title: 'Busca un evento',
    description:
      'Filtra por deporte, ciudad, nivel y fecha. Encuentra la actividad perfecta para ti en segundos.',
  },
  {
    number: '02',
    emoji: '✋',
    title: 'Únete en un clic',
    description:
      'Solicita tu plaza directamente desde la app. Sin formularios, sin complicaciones.',
  },
  {
    number: '03',
    emoji: '🏅',
    title: '¡A jugar!',
    description:
      'Recibe confirmación, ve al lugar y disfruta del deporte con personas de tu nivel.',
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="py-16 sm:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-sm-green-600 uppercase tracking-wide mb-1">
            Simple y rápido
          </p>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-sm-dark">
            ¿Cómo funciona SportMatch?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-sm-green-50 border border-sm-green-200 flex items-center justify-center text-3xl">
                {step.emoji}
              </div>
              <div>
                <p className="text-xs font-bold text-sm-green-500 uppercase tracking-widest mb-1">
                  Paso {step.number}
                </p>
                <h3 className="font-heading font-semibold text-lg text-sm-dark mb-2">{step.title}</h3>
                <p className="text-sm-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
