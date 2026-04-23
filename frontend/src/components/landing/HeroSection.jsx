import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="py-20 sm:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sm-green-50 border border-sm-green-200 text-sm font-semibold text-sm-green-700 mb-8">
          <span>🏆</span>
          <span>Plataforma de deporte amateur</span>
        </div>

        {/* H1 */}
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-sm-dark leading-tight mb-6 max-w-3xl mx-auto">
          Organiza y únete a actividades deportivas en tu ciudad
        </h1>

        {/* Subtítulo */}
        <p className="text-lg sm:text-xl text-sm-gray-500 max-w-2xl mx-auto mb-10">
          Encuentra partidos, entrenamientos y eventos cerca de ti. Conecta con deportistas de tu nivel y juega cuando quieras.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <Link
            to="/register"
            className="w-full sm:w-auto px-6 py-3 text-base font-semibold text-white bg-sm-green-500 rounded-xl hover:bg-sm-green-600 transition-colors shadow-sm"
          >
            Empezar — es gratis
          </Link>
          <Link
            to="/events"
            className="w-full sm:w-auto px-6 py-3 text-base font-semibold text-sm-gray-700 border border-sm-gray-200 rounded-xl hover:bg-sm-gray-50 transition-colors"
          >
            Ver eventos →
          </Link>
        </div>

        {/* Checks */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-sm-gray-500">
          {['Sin suscripciones', 'Todos los deportes', 'Filtro por nivel'].map((text) => (
            <span key={text} className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-sm-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
