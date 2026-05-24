import { useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={`text-2xl leading-none transition-colors ${
            active >= star ? 'text-amber-400' : 'text-sm-gray-200 hover:text-amber-300'
          }`}
          aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function RatingModal({ eventId, participants, onClose, onSuccess }) {
  const [ratings, setRatings] = useState(
    Object.fromEntries(participants.map((p) => [p.id, { puntuacion: 0, comentario: '' }]))
  );
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);

  const setPuntuacion = (id, val) =>
    setRatings((prev) => ({ ...prev, [id]: { ...prev[id], puntuacion: val } }));
  const setComentario = (id, val) =>
    setRatings((prev) => ({ ...prev, [id]: { ...prev[id], comentario: val } }));

  const handleSubmit = async () => {
    const toSubmit = participants.filter((p) => (ratings[p.id]?.puntuacion ?? 0) > 0);
    if (toSubmit.length === 0) {
      toast.error('Selecciona al menos una puntuación antes de enviar.');
      return;
    }

    setLoading(true);
    const results = await Promise.allSettled(
      toSubmit.map((p) =>
        api.post('/api/ratings', {
          valorado_id: p.id,
          evento_id:   eventId,
          puntuacion:  ratings[p.id].puntuacion,
          ...(ratings[p.id].comentario?.trim()
            ? { comentario: ratings[p.id].comentario.trim() }
            : {}),
        })
      )
    );
    setLoading(false);

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const already   = results.filter(
      (r) => r.status === 'rejected' && r.reason?.response?.status === 409
    ).length;

    if (succeeded === 0 && already === toSubmit.length) {
      setAlreadyRated(true);
      onSuccess?.('already_rated');
    } else if (succeeded > 0) {
      setDone(true);
      onSuccess?.('done');
    } else {
      toast.error('Hubo un problema al enviar las valoraciones. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={!loading ? onClose : undefined}
      />

      {/* Card */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sm-gray-100 shrink-0">
          <h2 className="font-heading font-semibold text-sm-dark text-base">
            Valorar participantes
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-sm-gray-400 hover:text-sm-gray-700 hover:bg-sm-gray-100 transition-colors disabled:opacity-40"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {done ? (
            <div className="flex flex-col items-center py-10 gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-sm-green-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-sm-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-heading font-semibold text-sm-dark">¡Valoraciones enviadas!</p>
              <p className="text-sm text-sm-gray-500">Gracias por valorar a los participantes del evento.</p>
            </div>
          ) : alreadyRated ? (
            <div className="flex flex-col items-center py-10 gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-heading font-semibold text-sm-dark">Ya has valorado este evento</p>
              <p className="text-sm text-sm-gray-500">Ya enviaste tus valoraciones anteriormente.</p>
            </div>
          ) : participants.length === 0 ? (
            <div className="py-10 text-center text-sm-gray-400">
              <p className="text-4xl mb-3">🏅</p>
              <p className="text-sm font-medium text-sm-dark mb-1">Sin participantes que valorar</p>
              <p className="text-sm">No hay otros participantes confirmados en este evento.</p>
            </div>
          ) : (
            participants.map((p) => {
              const initial  = (p.nombre ?? '?').charAt(0).toUpperCase();
              const fullName = `${p.nombre ?? ''} ${p.apellidos ?? ''}`.trim();
              const r        = ratings[p.id];
              return (
                <div key={p.id} className="bg-sm-gray-50 rounded-2xl p-4 space-y-3">
                  {/* Identity */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-sm-green-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {p.foto_perfil
                        ? <img src={p.foto_perfil} alt={fullName} className="w-full h-full object-cover" />
                        : <span className="text-sm font-bold text-sm-green-800">{initial}</span>
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-sm-dark leading-tight">{fullName}</p>
                      {p.isOrganizer && (
                        <span className="text-xs text-sm-green-600 font-medium">Organizador</span>
                      )}
                    </div>
                  </div>

                  {/* Stars */}
                  <div>
                    <p className="text-xs font-semibold text-sm-gray-500 mb-1.5">Puntuación</p>
                    <StarPicker value={r.puntuacion} onChange={(val) => setPuntuacion(p.id, val)} />
                  </div>

                  {/* Comment */}
                  <div>
                    <p className="text-xs font-semibold text-sm-gray-500 mb-1.5">
                      Comentario <span className="font-normal text-sm-gray-400">(opcional)</span>
                    </p>
                    <textarea
                      value={r.comentario}
                      onChange={(e) => setComentario(p.id, e.target.value)}
                      maxLength={500}
                      rows={2}
                      placeholder="¿Cómo fue la experiencia con esta persona?"
                      className="w-full rounded-xl border border-sm-gray-200 px-3 py-2 text-sm text-sm-dark placeholder:text-sm-gray-300 outline-none focus:border-sm-green-400 focus:ring-2 focus:ring-sm-green-100 resize-none transition-colors"
                    />
                    <p className="text-right text-xs text-sm-gray-300 mt-0.5">{r.comentario.length}/500</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-sm-gray-100 shrink-0">
          {done || alreadyRated ? (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-sm-green-500 text-white text-sm font-semibold hover:bg-sm-green-600 transition-colors"
            >
              Cerrar
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-full text-sm font-semibold text-sm-gray-600 hover:bg-sm-gray-100 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || participants.length === 0}
                className="px-5 py-2 rounded-full bg-sm-green-500 text-white text-sm font-semibold hover:bg-sm-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar valoraciones'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
