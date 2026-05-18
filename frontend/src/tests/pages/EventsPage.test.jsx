import { screen, waitFor, fireEvent, act } from '@testing-library/react';
import EventsPage from '../../pages/EventsPage';
import api from '../../services/api';
import { renderWithProviders, authenticatedUser } from '../helpers/renderWithProviders';

vi.mock('../../services/api', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    delete: vi.fn(),
  },
}));

// Navbar: no se mockea — funciona correctamente con el AuthContext proporcionado.

const mockEvents = [
  {
    id: 'ev-1',
    titulo: 'Partido de fútbol',
    deporte: 'futbol',
    direccion: 'Calle Mayor 1, Murcia',
    fecha_hora: '2025-12-25T10:00:00.000Z',
    aforo_maximo: 10,
    aforo_actual: 3,
    nivel_requerido: 'intermedio',
    estado: 'abierto',
    organizador: { nombre: 'Carlos' },
  },
  {
    id: 'ev-2',
    titulo: 'Clase de pádel',
    deporte: 'padel',
    direccion: 'Club de Pádel, Murcia',
    fecha_hora: '2025-12-26T11:00:00.000Z',
    aforo_maximo: 4,
    aforo_actual: 1,
    nivel_requerido: 'principiante',
    estado: 'abierto',
    organizador: { nombre: 'María' },
  },
];

function renderEventsPage() {
  return renderWithProviders(<EventsPage />, { initialAuthState: authenticatedUser });
}

describe('EventsPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('muestra skeletons de carga mientras la API no ha respondido', () => {
    api.get.mockReturnValue(new Promise(() => {})); // nunca resuelve
    renderEventsPage();

    // EventsGrid renderiza 6 SkeletonCards (cada uno tiene clase animate-pulse)
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(6);
  });

  it('renderiza la lista de eventos cuando la API responde correctamente', async () => {
    api.get.mockResolvedValue({ data: { events: mockEvents, total: 2 } });
    renderEventsPage();

    await waitFor(() => {
      expect(screen.getByText('Partido de fútbol')).toBeInTheDocument();
      expect(screen.getByText('Clase de pádel')).toBeInTheDocument();
    });
    expect(screen.getByText(/2 eventos encontrados/)).toBeInTheDocument();
  });

  it('muestra el mensaje "No hay eventos" cuando la API devuelve un array vacío', async () => {
    api.get.mockResolvedValue({ data: { events: [], total: 0 } });
    renderEventsPage();

    await waitFor(() => {
      expect(screen.getByText('No hay eventos')).toBeInTheDocument();
    });
  });

  it('muestra el banner de error si la API falla', async () => {
    api.get.mockRejectedValue(new Error('Network error'));
    renderEventsPage();

    await waitFor(() => {
      expect(screen.getByText(/No se pudieron cargar los eventos/)).toBeInTheDocument();
    });
  });

  it('al cambiar el filtro de deporte realiza una nueva petición con el filtro aplicado', async () => {
    api.get.mockResolvedValue({ data: { events: mockEvents, total: 2 } });
    renderEventsPage();

    // Esperar carga inicial
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));

    // El primer <select> en EventsFilters es el de deporte
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'futbol' } });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    });

    const lastCall = api.get.mock.calls.at(-1);
    expect(lastCall[1].params).toMatchObject({ deporte: 'futbol' });
  });

  it('el campo de búsqueda actualiza los resultados tras el debounce de 400 ms', async () => {
    api.get.mockResolvedValue({ data: { events: mockEvents, total: 2 } });
    renderEventsPage();

    // Esperar carga inicial con timers reales (waitFor/findBy* necesitan setTimeout real)
    await waitFor(() => expect(screen.getByText('Partido de fútbol')).toBeInTheDocument());
    const callsAfterLoad = api.get.mock.calls.length;

    // Ahora sí falsificamos solo setTimeout/clearTimeout para controlar el debounce
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    // Escribir en el buscador (activa el debounce de 400 ms)
    fireEvent.change(
      screen.getByPlaceholderText('Buscar eventos...'),
      { target: { value: 'partido' } }
    );

    // Avanzar el reloj para superar el debounce
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Restaurar timers reales ANTES de usar waitFor
    vi.useRealTimers();

    // Debe haberse realizado una nueva llamada a la API
    await waitFor(() => {
      expect(api.get.mock.calls.length).toBeGreaterThan(callsAfterLoad);
    });

    const lastCall = api.get.mock.calls.at(-1);
    expect(lastCall[1].params).toMatchObject({ search: 'partido' });
  });
});

// Total: 6 casos de test cubiertos
//   muestra skeletons mientras carga
//   renderiza lista de eventos en carga exitosa
//   muestra "No hay eventos" con array vacío
//   muestra banner de error si la API falla
//   filtro de deporte desencadena nueva petición
//   búsqueda con debounce actualiza los resultados
