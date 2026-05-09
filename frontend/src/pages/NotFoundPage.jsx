import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-sm-gray-500">
      <p className="text-7xl font-bold text-sm-gray-200">404</p>
      <h1 className="text-xl font-semibold text-sm-dark">Página no encontrada</h1>
      <p className="text-sm">La dirección que buscas no existe o ha sido movida.</p>
      <Link
        to="/"
        className="px-5 py-2 rounded-full bg-sm-green-500 text-white text-sm font-semibold hover:bg-sm-green-600 transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
