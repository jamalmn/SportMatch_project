import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import SPORT_EMOJI from '../../utils/sportEmoji';

const NIVEL_LABELS = {
  principiante: 'Principiante',
  intermedio:   'Intermedio',
  avanzado:     'Avanzado',
};

const NIVEL_CLASSES = {
  principiante: 'bg-green-100 text-green-700',
  intermedio:   'bg-amber-100 text-amber-700',
  avanzado:     'bg-red-100 text-red-700',
};

/* ── Stars ──────────────────────────────────────────────────────────────── */

function StarRating({ value = 0, max = 5 }) {
  const filled = Math.round(value);
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < filled ? 'text-amber-400' : 'text-sm-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

/* ── Sport chip ──────────────────────────────────────────────────────────── */

function SportChip({ sport, onRemove }) {
  const emoji = SPORT_EMOJI[sport.toLowerCase()] ?? '🏅';
  return (
    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sm-green-50 text-sm-green-700 text-xs font-medium border border-sm-green-200">
      <span>{emoji}</span>
      <span className="capitalize">{sport}</span>
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(sport)}
          className="ml-0.5 text-sm-green-400 hover:text-sm-green-700 transition-colors"
          aria-label={`Eliminar ${sport}`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */

export default function ProfileHeader({ user, isOwnProfile, onEditClick }) {
  const navigate     = useNavigate();
  const fileInputRef = useRef(null);

  const [deportes, setDeportes]         = useState(user.deportes_favoritos ?? []);
  const [addingDeporte, setAddingDeporte] = useState(false);
  const [newDeporte, setNewDeporte]     = useState('');
  const [saving, setSaving]             = useState(false);

  const fullName = `${user.nombre ?? ''} ${user.apellidos ?? ''}`.trim();
  const initial  = user.nombre?.charAt(0).toUpperCase() ?? '?';
  const rating   = Number(user.rating_promedio ?? 0);
  const total    = user.total_valoraciones ?? 0;

  /* Photo upload — handler prepared, real upload not yet implemented */
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // TODO: upload photo
    // const form = new FormData();
    // form.append('foto_perfil', file);
    // api.put(`/api/users/${user.id}`, form);
  };

  /* Sports CRUD */
  const updateDeportes = async (updated) => {
    setSaving(true);
    try {
      await api.put('/api/users/me', { deportes_favoritos: updated });
      setDeportes(updated);
    } catch { /* silently ignore — UI stays unchanged */ }
    finally { setSaving(false); }
  };

  const removeDeporte = (sport) => updateDeportes(deportes.filter(d => d !== sport));

  const commitAddDeporte = (e) => {
    e?.preventDefault();
    const val = newDeporte.trim().toLowerCase();
    setAddingDeporte(false);
    setNewDeporte('');
    if (!val || deportes.includes(val)) return;
    updateDeportes([...deportes, val]);
  };

  return (
    <div className="bg-white border border-sm-gray-200 rounded-2xl p-6 space-y-5">

      {/* ── Top row: avatar + meta + action ──────────────────────────────── */}
      <div className="flex items-start gap-4">

        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-full bg-sm-green-200 flex items-center justify-center overflow-hidden ring-2 ring-white">
            {user.foto_perfil
              ? <img src={user.foto_perfil} alt={fullName} className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold text-sm-green-800">{initial}</span>
            }
          </div>
          {isOwnProfile && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-sm-gray-200 shadow-sm flex items-center justify-center hover:bg-sm-gray-50 transition-colors"
                aria-label="Cambiar foto de perfil"
              >
                <svg className="w-3.5 h-3.5 text-sm-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </>
          )}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-xl font-bold text-sm-dark leading-tight">{fullName}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {user.ubicacion && (
              <span className="flex items-center gap-1 text-xs text-sm-gray-500">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {user.ubicacion}
              </span>
            )}
            {user.nivel && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${NIVEL_CLASSES[user.nivel] ?? 'bg-sm-gray-100 text-sm-gray-600'}`}>
                {NIVEL_LABELS[user.nivel] ?? user.nivel}
              </span>
            )}
            <span className="flex items-center gap-1">
              <StarRating value={rating} />
              <span className="text-xs text-sm-gray-500">({total})</span>
            </span>
          </div>
        </div>

        {/* Action button */}
        <div className="shrink-0">
          {isOwnProfile ? (
            <button
              type="button"
              onClick={onEditClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sm-gray-100 hover:bg-sm-gray-200 text-sm-dark text-xs font-semibold transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Editar perfil
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate(`/events?organizador=${user.id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sm-green-500 hover:bg-sm-green-600 text-white text-xs font-semibold transition-colors"
            >
              Ver eventos
            </button>
          )}
        </div>
      </div>

      {/* ── Bio ──────────────────────────────────────────────────────────── */}
      {user.bio && (
        <p className={`text-sm text-sm-gray-500 leading-relaxed ${!isOwnProfile ? 'line-clamp-2' : ''}`}>
          {user.bio}
        </p>
      )}

      {/* ── Sports chips ─────────────────────────────────────────────────── */}
      {(deportes.length > 0 || isOwnProfile) && (
        <div className="flex flex-wrap gap-2">
          {deportes.map(sport => (
            <SportChip
              key={sport}
              sport={sport}
              onRemove={isOwnProfile ? removeDeporte : undefined}
            />
          ))}

          {isOwnProfile && (
            addingDeporte ? (
              <form onSubmit={commitAddDeporte} className="flex items-center">
                <input
                  autoFocus
                  value={newDeporte}
                  onChange={e => setNewDeporte(e.target.value)}
                  onBlur={commitAddDeporte}
                  placeholder="ej: fútbol"
                  className="text-xs border border-sm-green-400 rounded-full px-2.5 py-1 outline-none focus:ring-1 focus:ring-sm-green-300 w-28"
                />
              </form>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={() => setAddingDeporte(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-sm-green-400 text-sm-green-600 text-xs font-medium hover:bg-sm-green-50 transition-colors disabled:opacity-40"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Añadir
              </button>
            )
          )}
        </div>
      )}

      {/* ── Stats grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Asistidos',    value: user.eventos_asistidos   ?? 0 },
          { label: 'Organizados',  value: user.eventos_organizados  ?? 0 },
          { label: 'Valoración',   value: rating.toFixed(1) },
          { label: 'Valoraciones', value: total },
        ].map(({ label, value }) => (
          <div key={label} className="bg-sm-gray-50 rounded-xl p-3 text-center">
            <p className="text-base font-bold text-sm-dark">{value}</p>
            <p className="text-xs text-sm-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
