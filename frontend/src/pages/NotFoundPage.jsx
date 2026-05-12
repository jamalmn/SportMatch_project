import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-sm-gray-500 overflow-hidden relative">
      {/* Floating blobs */}
      <div className="absolute w-72 h-72 bg-sm-green-500/10 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite] top-1/4 -left-20 pointer-events-none" />
      <div className="absolute w-56 h-56 bg-sm-green-500/10 rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite_1s] bottom-1/4 -right-16 pointer-events-none" />

      {/* 404 with bounce-in */}
      <p
        className="text-8xl font-black text-sm-green-500 drop-shadow-lg"
        style={{ animation: 'bounceIn 0.7s cubic-bezier(0.36,0.07,0.19,0.97) both' }}
      >
        404
      </p>

      {/* Texts fade-up */}
      <h1
        className="text-2xl font-bold text-sm-dark"
        style={{ animation: 'fadeUp 0.5s ease 0.3s both' }}
      >
        Página no encontrada
      </h1>
      <p
        className="text-sm text-center max-w-xs"
        style={{ animation: 'fadeUp 0.5s ease 0.5s both' }}
      >
        La dirección que buscas no existe o ha sido movida.
      </p>

      {/* Button fade-up + hover scale */}
      <Link
        to="/"
        className="mt-2 px-6 py-2.5 rounded-full bg-sm-green-500 text-white text-sm font-semibold
                   hover:bg-sm-green-600 hover:scale-105 active:scale-95
                   transition-all duration-200 shadow-md hover:shadow-lg"
        style={{ animation: 'fadeUp 0.5s ease 0.7s both' }}
      >
        Volver al inicio
      </Link>

      <style>{`
        @keyframes bounceIn {
          0%   { transform: scale(0.3); opacity: 0; }
          50%  { transform: scale(1.1); opacity: 1; }
          70%  { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
