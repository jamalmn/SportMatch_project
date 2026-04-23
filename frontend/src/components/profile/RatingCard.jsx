import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function Stars({ value, max = 5 }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < value ? 'text-amber-400' : 'text-sm-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default function RatingCard({ rating, isLast }) {
  const navigate  = useNavigate();
  const valorador = rating.valorador ?? {};
  const evento    = rating.evento    ?? {};

  const initial  = valorador.nombre?.charAt(0).toUpperCase() ?? '?';
  const fullName = `${valorador.nombre ?? ''} ${valorador.apellidos ?? ''}`.trim();

  let dateStr = '';
  try {
    const raw = format(new Date(rating.created_at), "d MMM yyyy", { locale: es });
    dateStr = raw.charAt(0).toUpperCase() + raw.slice(1);
  } catch { /* ignore */ }

  return (
    <div className={`px-4 py-4 ${!isLast ? 'border-b border-sm-gray-100' : ''}`}>
      <div className="flex items-start gap-3">

        {/* Avatar */}
        <button
          type="button"
          onClick={() => navigate(`/profile/${valorador.id}`)}
          className="shrink-0"
          aria-label={`Ver perfil de ${fullName}`}
        >
          <div className="w-9 h-9 rounded-full bg-sm-green-200 flex items-center justify-center overflow-hidden">
            {valorador.foto_perfil
              ? <img src={valorador.foto_perfil} alt={fullName} className="w-full h-full object-cover" />
              : <span className="text-sm font-bold text-sm-green-800">{initial}</span>
            }
          </div>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name + stars row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => navigate(`/profile/${valorador.id}`)}
              className="text-sm font-semibold text-sm-dark hover:underline truncate"
            >
              {fullName}
            </button>
            <div className="flex items-center gap-1.5 shrink-0">
              <Stars value={rating.puntuacion} />
              <span className="text-xs font-bold text-amber-500">{rating.puntuacion}</span>
            </div>
          </div>

          {/* Comment */}
          {rating.comentario && (
            <p className="text-sm text-sm-gray-500 mt-1.5 leading-relaxed">
              {rating.comentario}
            </p>
          )}

          {/* Event + date */}
          <p className="text-xs text-sm-gray-400 mt-2 truncate">
            {evento.titulo && <span className="font-medium">{evento.titulo}</span>}
            {evento.titulo && dateStr && <span className="mx-1">·</span>}
            {dateStr}
          </p>
        </div>

      </div>
    </div>
  );
}
