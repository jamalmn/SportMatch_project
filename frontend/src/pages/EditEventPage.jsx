import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import EventForm from '../components/events/EventForm';

function SkeletonForm() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-sm-gray-100 rounded-xl w-full" />
      <div className="h-10 bg-sm-gray-100 rounded-xl w-full" />
      <div className="h-24 bg-sm-gray-100 rounded-xl w-full" />
    </div>
  );
}

export default function EditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/api/events/${id}`)
      .then(res => setEvent(res.data))
      .catch(() => setError('No se pudo cargar el evento.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-sm-gray-100 animate-pulse" />
          <div className="h-6 w-40 rounded-lg bg-sm-gray-100 animate-pulse" />
        </div>
        <SkeletonForm />
      </main>
    );
  }

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

  if (user?.id !== event.organizador_id) {
    return <Navigate to={`/events/${id}`} replace />;
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
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
        <h1 className="font-heading font-bold text-xl text-sm-dark">Editar evento</h1>
      </div>

      <EventForm mode="edit" eventId={id} defaultValues={event} />
    </main>
  );
}
