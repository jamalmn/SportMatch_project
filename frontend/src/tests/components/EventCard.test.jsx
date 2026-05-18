import { render, screen, fireEvent } from '@testing-library/react';
import EventCard from '../../components/events/EventCard';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const baseEvent = {
  id: 'event-123',
  titulo: 'Partido de fútbol sala',
  deporte: 'futbol',
  direccion: 'Pabellón Municipal, Murcia',
  fecha_hora: '2025-12-25T10:00:00.000Z',
  aforo_maximo: 10,
  aforo_actual: 3,
  nivel_requerido: 'intermedio',
  estado: 'abierto',
  organizador: { nombre: 'Carlos' },
};

describe('EventCard', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('renderiza el título del evento', () => {
    render(<EventCard event={baseEvent} />);
    expect(screen.getByText('Partido de fútbol sala')).toBeInTheDocument();
  });

  it('muestra la dirección del evento', () => {
    render(<EventCard event={baseEvent} />);
    expect(screen.getByText('Pabellón Municipal, Murcia')).toBeInTheDocument();
  });

  it('muestra badge "Lleno" cuando aforo_actual alcanza aforo_maximo', () => {
    const eventoLleno = { ...baseEvent, aforo_actual: 10, estado: 'abierto' };
    render(<EventCard event={eventoLleno} />);
    expect(screen.getByText('Lleno')).toBeInTheDocument();
  });

  it('muestra badge "Abierto" y el contador de inscritos cuando hay plazas', () => {
    render(<EventCard event={baseEvent} />);
    expect(screen.getByText('Abierto')).toBeInTheDocument();
    expect(screen.getByText(/3\/10/)).toBeInTheDocument();
  });

  it('navega a /events/:id al hacer click en la tarjeta', () => {
    render(<EventCard event={baseEvent} />);
    fireEvent.click(screen.getByRole('article'));
    expect(mockNavigate).toHaveBeenCalledWith('/events/event-123');
  });

  it('muestra el nivel requerido del evento', () => {
    render(<EventCard event={baseEvent} />);
    expect(screen.getByText('Intermedio')).toBeInTheDocument();
  });
});
