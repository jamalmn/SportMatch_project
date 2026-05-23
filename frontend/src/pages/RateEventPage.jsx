import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import { toast } from 'react-toastify';

/* ── Star picker ──────────────────────────────────────────────────────────── */

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={`text-2xl transition-colors leading-none ${
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

/* ── Single participant card ──────────────────────────────────────────────── */

function ParticipantCard({ participant, isOrganizer, eventId }) {
  const [puntuacion, setPuntuacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);

  const initial  = participant.nombre?.charAt(0).toUpperCase() ?? '?';
  const fullName = `${participant.nombre ?? ''} ${participant.apellidos ?? ''}`.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!puntuacion) { toast.error('Selecciona una puntuación antes de enviar'); return; }
    setLoading(true);
    try {
      await api.post('/api/ratings', {
        valorado_id: participant.id,
        evento_id:   eventId,
        puntuacion,
        ...(comentario.trim() ? { comentario: comentario.trim() } : {}),
      });
      setDone(true);
      toast.success(`Valoración enviada a ${participant.nombre}`);
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Error al enviar la valoración';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-sm-gray-200 rounded-2xl p-5">
      {/* Participant identity */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-sm-green-100 flex items-center justify-center shrink-0 overflow-hidden">
          {participant.foto_perfil
            ? <img src={participant.foto_perfil} alt={fullName} className="w-full h-full object-cover" />
            : <span className="font-bold text-sm text-sm-green-800">{initial}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-sm-dark truncate">{fullName}</p>
          {isOrganizer && (
            <span className="text-xs text-sm-green-600 font-medium">Organizador</span>
          )}
        </div>
      </div>

      {/* Done state */}
      {done ? (
        <div className="flex items-center gap-2 bg-sm-green-50 text-sm-green-700 rounded-xl px-4 py-3 text-sm font-medium">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Valoración enviada correctamente
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-sm-gray-600 mb-1.5">Puntuación</p>
            <StarPicker value={puntuacion} onChange={setPuntuacion} />
          </div>

          <div>
            <p className="text-xs font-semibold text-sm-gray-600 mb-1.5">
              Comentario <span className="font-normal text-sm-gray-400">(opcional)</span>
            </p>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="¿Cómo fue la experiencia jugando con esta persona?"
              className="w-full rounded-xl border border-sm-gray-200 px-3.5 py-2.5 text-sm text-sm-dark placeholder:text-sm-gray-300 outline-none focus:border-sm-green-500 focus:ring-2 focus:ring-sm-green-100 resize-none transition-colors"
            />
            <p className="text-right text-xs text-sm-gray-300 mt-0.5">{comentario.length}/500</p>
          </div>

          <button
            type="submit"
            disabled={loading || !puntuacion}
            className="w-full py-2 rounded-full bg-sm-green-500 text-white text-sm font-semibold hover:bg-sm-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Enviando...' : 'Enviar valoración'}
          </button>
        </form>
      )}
    </div>
  );
}

/* ── Skeleton ─────────────────────────────────────────────────────────────── */

function SkeletonPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4 animate-pulse">
      <div className="h-8 bg-sm-gray-100 rounded-xl w-1/2" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-44 bg-sm-gray-100 rounded-2xl" />
      ))}
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */

export default function RateEventPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    api.get(`/api/events/${id}`)
      .then((res) => setEvent(res.data))
      .catch(() => setError('No se pudo cargar el evento.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <><Navbar /><SkeletonPage /></>;

  if (error) {
    return (
      <>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-sm-gray-500 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 rounded-full bg-sm-green-500 text-white text-sm font-semibold hover:bg-sm-green-600 transition-colors"
          >
            Volver
          </button>
        </main>
      </>
    );
  }

  /* Build the list of people to rate (exclude current user) */
  const organizer   = event.organizador ?? null;
  const participants = (event.participantes ?? []).filter((p) => p.id !== user?.id);
  const showOrganizer = organizer && organizer.id !== user?.id
    && !participants.some((p) => p.id === organizer.id);

  const toRate = [
    ...(showOrganizer ? [{ ...organizer, _isOrganizer: true }] : []),
    ...participants,
  ];

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(`/events/${id}`)}
            className="p-2 rounded-xl hover:bg-sm-gray-100 transition-colors text-sm-gray-500"
            aria-label="Volver al evento"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="font-heading font-bold text-xl text-sm-dark">Valorar participantes</h1>
            <p className="text-xs text-sm-gray-400 truncate mt-0.5">{event.titulo}</p>
          </div>
        </div>

        {/* Warning if event is not finalized */}
        {event.estado !== 'finalizado' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-700 mb-6">
            Las valoraciones solo se pueden enviar cuando el evento ha <strong>finalizado</strong>.
            El organizador debe marcarlo como finalizado primero.
          </div>
        )}

        {/* Participant list */}
        {toRate.length === 0 ? (
          <div className="text-center py-16 text-sm-gray-400">
            <p className="text-4xl mb-4">🏅</p>
            <p className="text-base font-medium text-sm-dark mb-1">Sin participantes que valorar</p>
            <p className="text-sm">No hay otros participantes en este evento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {toRate.map((p) => (
              <ParticipantCard
                key={p.id}
                participant={p}
                isOrganizer={p._isOrganizer ?? false}
                eventId={id}
              />
            ))}
          </div>
        )}

      </main>
    </>
  );
}
