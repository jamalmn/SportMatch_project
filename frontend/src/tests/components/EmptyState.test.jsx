// Adapted from Button.test.jsx — EmptyState is the closest equivalent:
// it renders content and exposes an optional action button.
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../../components/common/EmptyState';

describe('EmptyState', () => {
  it('renderiza el título cuando se proporciona', () => {
    render(<EmptyState title="No hay resultados" />);
    expect(screen.getByText('No hay resultados')).toBeInTheDocument();
  });

  it('renderiza la descripción cuando se proporciona', () => {
    render(<EmptyState title="Sin datos" description="Prueba con otros filtros." />);
    expect(screen.getByText('Prueba con otros filtros.')).toBeInTheDocument();
  });

  it('renderiza el botón de acción con el texto correcto cuando se dan actionLabel y onAction', () => {
    render(
      <EmptyState title="Sin eventos" actionLabel="Crear evento" onAction={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: 'Crear evento' })).toBeInTheDocument();
  });

  it('llama a onAction al hacer click en el botón de acción', () => {
    const onAction = vi.fn();
    render(
      <EmptyState title="Sin eventos" actionLabel="Crear evento" onAction={onAction} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Crear evento' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('no renderiza el botón cuando no se proporciona actionLabel u onAction', () => {
    render(<EmptyState title="Sin eventos" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
