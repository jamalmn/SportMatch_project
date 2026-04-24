import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import EventHeader from '../components/events/EventHeader';
import ParticipantsList from '../components/events/ParticipantsList';
import ActionSidebar from '../components/events/ActionSidebar';
import ConfirmModal from '../components/common/ConfirmModal';

const EventMap = lazy(() => import('../components/events/EventMap'));

function SkeletonDetail() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse space-y-4">
      <div className="h-8 bg-sm-gray-100 rounded-xl w-2/3" />
      <div className="h-4 bg-sm-gray-100 rounded-xl w-1/3" />
      <div className="h-48 bg-sm-gray-100 rounded-2xl w-full" />
    </div>
  );
}

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ open: false, type: null });

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      api.get(`/api/events/${id}`),
      api.get(`/api/events/${id}/inscriptions`),
    ])
      .then(([evRes, insRes]) => {
        setEvent(evRes.data);
        setInscriptions(insRes.data.inscriptions ?? []);
      })
      .catch(() => setError('No se pudo cargar el evento.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <SkeletonDetail />;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-sm-gray-500">
        <p className="text-base">{error}</p>
        <button
          onClick={() => navigate('/events')}
          className="px-5 py-2 rounded-full bg-sm-green-500 text-white text-sm font-semibold hover:bg-sm-green-600 transition-colors"
        >
          Volver a eventos
        </button>
      </div>
    );
  }

  const isOrganizer   = user?.id === event.organizador_id;
  const myInscription = inscriptions.find(i => i.usuario_id === user?.id);
  const isConfirmed   = myInscription?.estado === 'confirmed';
  const isWaiting     = myInscription?.estado === 'waiting';
  const plazasLibres  = event.aforo_maximo - inscriptions.filter(i => i.estado === 'confirmed').length;
  const isPast        = new Date(event.fecha_hora) < new Date();

  const sharedProps = {
    event,
    inscriptions,
    isOrganizer,
    myInscription,
    isConfirmed,
    isWaiting,
    plazasLibres,
    isPast,
    user,
    onDataChange: (updatedEvent, updatedInscriptions) => {
      if (updatedEvent)        setEvent(updatedEvent);
      if (updatedInscriptions) setInscriptions(updatedInscriptions);
    },
  };

  const refreshData = async () => {
    const [evRes, insRes] = await Promise.all([
      api.get(`/api/events/${id}`),
      api.get(`/api/events/${id}/inscriptions`),
    ]);
    setEvent(evRes.data);
    setInscriptions(insRes.data.inscriptions ?? []);
  };

  const handleJoin = async () => {
    try {
      await api.post(`/api/events/${id}/inscriptions`);
      await refreshData();
    } catch { /* toast en iteración futura */ }
  };

  const handleLeave = () => setModal({ open: true, type: 'leave' });

  const confirmLeave = async () => {
    setModal({ open: false, type: null });
    try {
      await api.delete(`/api/events/${id}/inscriptions`);
      await refreshData();
    } catch { /* ignore */ }
  };

  const handleCancelEvent = () => setModal({ open: true, type: 'cancel' });

  const confirmCancelEvent = async () => {
    setModal({ open: false, type: null });
    try {
      await api.delete(`/api/events/${id}`);
      navigate('/events');
    } catch { /* ignore */ }
  };

  const handleRate = () => navigate(`/ratings/new?event=${id}`);

  return (
    <>
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
        {/* Main column */}
        <div className="space-y-6">
          <EventHeader event={event} />

          {/* EventDetailInfo */}
          <EventDetailInfo {...sharedProps} />

          {/* Mapa — cargado en diferido para no bloquear el render inicial */}
          <Suspense fallback={<div className="h-48 sm:h-64 rounded-2xl bg-sm-gray-100 animate-pulse" />}>
            <EventMap
              lat={event.ubicacion_lat}
              lng={event.ubicacion_lng}
              address={event.direccion}
            />
          </Suspense>

          <ParticipantsList
            inscriptions={inscriptions}
            currentUserId={user?.id}
            organizadorId={event.organizador_id}
            aforoMaximo={event.aforo_maximo}
          />
        </div>

        {/* Sidebar */}
        <aside className="mt-6 lg:mt-0 lg:sticky lg:top-20 self-start">
          <ActionSidebar
            event={event}
            isOrganizer={isOrganizer}
            isConfirmed={isConfirmed}
            isWaiting={isWaiting}
            isPast={isPast}
            plazasLibres={plazasLibres}
            onJoin={handleJoin}
            onLeave={handleLeave}
            onCancel={handleCancelEvent}
            onRate={handleRate}
          />
        </aside>
      </div>
    </main>

    {/* Modales de confirmación */}
    <ConfirmModal
      isOpen={modal.open && modal.type === 'leave'}
      title="Cancelar inscripción"
      description="¿Seguro que quieres cancelar tu inscripción? Perderás tu plaza y tendrás que volver a apuntarte."
      confirmLabel="Sí, cancelar"
      confirmVariant="danger"
      onConfirm={confirmLeave}
      onCancel={() => setModal({ open: false, type: null })}
    />
    <ConfirmModal
      isOpen={modal.open && modal.type === 'cancel'}
      title="Cancelar evento"
      description="Esta acción es irreversible. Se notificará a todos los inscritos que el evento ha sido cancelado."
      confirmLabel="Cancelar evento"
      confirmVariant="danger"
      onConfirm={confirmCancelEvent}
      onCancel={() => setModal({ open: false, type: null })}
    />
    </>
  );
}

/* ── Inline placeholder subcomponents ─────────────────────────────────────
   These will be replaced by proper components in src/components/events/.
   They accept the full sharedProps spread so the prop contract is already
   established when the real implementations are wired in.
───────────────────────────────────────────────────────────────────────── */


function EventDetailInfo({ event }) {
  return (
    <div className="bg-white border border-sm-gray-200 rounded-2xl p-6 space-y-2">
      <p className="text-sm text-sm-gray-600">{event.descripcion}</p>
      <p className="text-xs text-sm-gray-400">{event.direccion}</p>
    </div>
  );
}


