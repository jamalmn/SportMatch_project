import { Link } from 'react-router-dom';

export default function CTAFinal() {
  return (
    <section className="py-16 sm:py-24 bg-sm-dark">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <span className="text-4xl mb-6 block">🏆</span>
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-4">
          Empieza a jugar hoy mismo
        </h2>
        <p className="text-sm-gray-400 text-lg mb-10 max-w-xl mx-auto">
          Únete a miles de deportistas amateurs que ya usan SportMatch para encontrar sus próximas actividades.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/register"
            className="w-full sm:w-auto px-6 py-3 text-base font-semibold text-white bg-sm-green-500 rounded-xl hover:bg-sm-green-600 transition-colors"
          >
            Crear cuenta gratis
          </Link>
          <Link
            to="/events"
            className="w-full sm:w-auto px-6 py-3 text-base font-semibold text-sm-gray-300 border border-sm-gray-700 rounded-xl hover:bg-sm-gray-800 transition-colors"
          >
            Ver eventos →
          </Link>
        </div>
      </div>
    </section>
  );
}
