import { screen, waitFor, fireEvent } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import EventDetailPage from '../../pages/EventDetailPage';
import api from '../../services/api';
import { renderWithProviders } from '../helpers/renderWithProviders';

vi.mock('../../services/api', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// EventMap usa Leaflet, que no funciona en jsdom → se sustituye por un stub
vi.mock('../../components/events/EventMap', () => ({
  default: () => <div data-testid="event-map" />,
}));

// ─── Datos de prueba ──────────────────────────────────────────────────────────

const mockEvent = {
  id: 'event-123',
  titulo: 'Partido de fútbol sala',
  descripcion: 'Un partido amistoso de fútbol sala en el pabellón.',
  deporte: 'futbol',
  direccion: 'Pabellón Municipal, Murcia',
  fecha_hora: '2027-12-25T10:00:00.000Z',
  aforo_maximo: 10,
  aforo_actual: 3,
  duracion_minutos: 60,
  nivel_requerido: 'intermedio',
  estado: 'abierto',
  organizador_id: 'organizer-1',
  organizador: { id: 'organizer-1', nombre: 'Carlos', apellidos: 'García' },
  ubicacion_lat: 37.99,
  ubicacion_lng: -1.10,
};

const guestAuth = {
  user: { id: 'user-1', nombre: 'Ana', apellidos: 'Pérez', email: 'ana@test.com' },
  token: 'token',
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
};

const organizerAuth = {
  user: { id: 'organizer-1', nombre: 'Carlos', apellidos: 'García', email: 'carlos@test.com' },
  token: 'token',
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setupApiMocks(inscriptions = []) {
  api.get.mockImplementation((url) => {
    if (url.endsWith('/inscriptions')) {
      // Si ya se procesó un POST (join), devolver el usuario como inscrito
      if (api.post.mock.calls.length > 0) {
        return Promise.resolve({
          data: { inscriptions: [{ id: 'ins-new', usuario_id: 'user-1', evento_id: 'event-123', estado: 'confirmed' }] },
        });
      }
      return Promise.resolve({ data: { inscriptions } });
    }
    return Promise.resolve({ data: mockEvent });
  });
}

function renderDetailPage(authState = guestAuth) {
  return renderWithProviders(
    <Routes>
      <Route path="/events/:id" element={<EventDetailPage />} />
    </Routes>,
    { initialRoute: '/events/event-123', initialAuthState: authState }
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('EventDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el título, la descripción y el nombre del organizador del evento', async () => {
    setupApiMocks();
    renderDetailPage();

    await waitFor(() => {
      expect(screen.getByText('Partido de fútbol sala')).toBeInTheDocument();
      expect(screen.getByText(/Un partido amistoso de fútbol sala/)).toBeInTheDocument();
      // EventHeader y OrganizerCard (ActionSidebar) muestran el nombre del organizador
      expect(screen.getAllByText(/Carlos/).length).toBeGreaterThan(0);
    });
  });

  it('muestra el botón "Unirse al evento" si hay plazas y el usuario no está inscrito', async () => {
    setupApiMocks([]); // sin inscripciones
    renderDetailPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Unirse al evento' })).toBeInTheDocument();
    });
  });

  it('muestra el botón "Cancelar inscripción" si el usuario ya está inscrito como confirmado', async () => {
    setupApiMocks([
      { id: 'ins-1', usuario_id: 'user-1', evento_id: 'event-123', estado: 'confirmed' },
    ]);
    renderDetailPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancelar inscripción' })).toBeInTheDocument();
    });
  });

  it('muestra el estado "En lista de espera" cuando el usuario está en la lista de espera', async () => {
    setupApiMocks([
      { id: 'ins-1', usuario_id: 'user-1', evento_id: 'event-123', estado: 'waiting' },
    ]);
    renderDetailPage();

    await waitFor(() => {
      expect(screen.getByText('En lista de espera')).toBeInTheDocument();
    });
  });

  it('muestra botones "Editar evento" y "Cancelar evento" si el usuario es el organizador', async () => {
    setupApiMocks();
    renderDetailPage(organizerAuth);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Editar evento' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancelar evento' })).toBeInTheDocument();
    });
  });

  it('al hacer click en "Unirse al evento" llama a api.post y actualiza la UI mostrando "Cancelar inscripción"', async () => {
    setupApiMocks();
    api.post.mockResolvedValue({});
    renderDetailPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Unirse al evento' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Unirse al evento' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/events/event-123/inscriptions');
    });

    // Tras la inscripción, refreshData actualiza el estado y aparece "Cancelar inscripción"
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancelar inscripción' })).toBeInTheDocument();
    });
  });
});

// Total: 6 casos de test cubiertos
//   muestra título, descripción y organizador
//   botón "Unirse al evento" cuando hay plazas y no inscrito
//   botón "Cancelar inscripción" cuando el usuario está inscrito
//   estado "En lista de espera" para usuario en waiting
//   botones "Editar evento" y "Cancelar evento" para el organizador
//   flujo completo de inscripción: POST + actualización de UI
