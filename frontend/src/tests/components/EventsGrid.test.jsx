import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../helpers/renderWithProviders';
import EventsGrid from '../../components/events/EventsGrid';

vi.mock('../../components/events/SkeletonCard', () => ({
  default: () => <div data-testid="skeleton-card" />,
}));

vi.mock('../../components/events/EventCard', () => ({
  default: ({ event }) => <div data-testid="event-card">{event.titulo}</div>,
}));

const mockEvents = [
  {
    id: 'ev-1',
    titulo: 'Partido de fútbol',
    deporte: 'futbol',
    direccion: 'Calle Mayor, Murcia',
    fecha_hora: '2025-12-25T10:00:00.000Z',
    aforo_maximo: 10,
    aforo_actual: 3,
    estado: 'abierto',
  },
  {
    id: 'ev-2',
    titulo: 'Ruta de ciclismo',
    deporte: 'ciclismo',
    direccion: 'Parque, Murcia',
    fecha_hora: '2025-12-26T09:00:00.000Z',
    aforo_maximo: 8,
    aforo_actual: 8,
    estado: 'completo',
  },
];

describe('EventsGrid', () => {
  it('muestra skeletons cuando loading=true', () => {
    renderWithProviders(
      <EventsGrid events={[]} loading={true} view="grid" onClearFilters={vi.fn()} />
    );
    expect(screen.getAllByTestId('skeleton-card').length).toBeGreaterThan(0);
  });

  it('muestra EmptyState cuando no hay eventos y loading=false', () => {
    renderWithProviders(
      <EventsGrid events={[]} loading={false} view="grid" onClearFilters={vi.fn()} />
    );
    expect(screen.getByText(/no hay eventos/i)).toBeInTheDocument();
  });

  it('llama a onClearFilters al pulsar el botón del EmptyState', () => {
    const onClearFilters = vi.fn();
    renderWithProviders(
      <EventsGrid events={[]} loading={false} view="grid" onClearFilters={onClearFilters} />
    );
    fireEvent.click(screen.getByText(/limpiar filtros/i));
    expect(onClearFilters).toHaveBeenCalled();
  });

  it('renderiza EventCard por cada evento en vista grid', () => {
    renderWithProviders(
      <EventsGrid events={mockEvents} loading={false} view="grid" onClearFilters={vi.fn()} />
    );
    expect(screen.getAllByTestId('event-card')).toHaveLength(2);
  });

  it('renderiza filas de lista en vista list con título y estado de plazas', () => {
    renderWithProviders(
      <EventsGrid events={mockEvents} loading={false} view="list" onClearFilters={vi.fn()} />
    );
    expect(screen.getByText('Partido de fútbol')).toBeInTheDocument();
    expect(screen.getByText('Ruta de ciclismo')).toBeInTheDocument();
    expect(screen.getByText(/libre/i)).toBeInTheDocument();
    expect(screen.getByText(/lleno/i)).toBeInTheDocument();
  });
});
