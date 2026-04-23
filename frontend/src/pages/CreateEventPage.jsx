import { useNavigate } from 'react-router-dom';
import EventForm from '../components/events/EventForm';

export default function CreateEventPage() {
  const navigate = useNavigate();

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/events')}
          className="p-2 rounded-xl hover:bg-sm-gray-100 transition-colors text-sm-gray-500"
          aria-label="Volver a eventos"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-heading font-bold text-xl text-sm-dark">Crear evento</h1>
      </div>

      <EventForm mode="create" />
    </main>
  );
}
