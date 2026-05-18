import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../helpers/renderWithProviders';
import Pagination from '../../components/common/Pagination';

describe('Pagination', () => {
  it('no renderiza nada cuando totalPages <= 1', () => {
    const { container } = renderWithProviders(
      <Pagination page={1} totalPages={1} onChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza los botones anterior y siguiente cuando hay varias páginas', () => {
    renderWithProviders(
      <Pagination page={2} totalPages={5} onChange={vi.fn()} />
    );
    expect(screen.getByText(/anterior/i)).toBeInTheDocument();
    expect(screen.getByText(/siguiente/i)).toBeInTheDocument();
  });

  it('el botón Anterior está deshabilitado en la primera página', () => {
    renderWithProviders(
      <Pagination page={1} totalPages={3} onChange={vi.fn()} />
    );
    expect(screen.getByText(/anterior/i)).toBeDisabled();
  });

  it('el botón Siguiente está deshabilitado en la última página', () => {
    renderWithProviders(
      <Pagination page={3} totalPages={3} onChange={vi.fn()} />
    );
    expect(screen.getByText(/siguiente/i)).toBeDisabled();
  });

  it('llama a onChange con la página siguiente al pulsar Siguiente', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Pagination page={2} totalPages={5} onChange={onChange} />
    );
    fireEvent.click(screen.getByText(/siguiente/i));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('llama a onChange con la página anterior al pulsar Anterior', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Pagination page={3} totalPages={5} onChange={onChange} />
    );
    fireEvent.click(screen.getByText(/anterior/i));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('llama a onChange con el número de página al pulsar un botón numérico', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Pagination page={1} totalPages={3} onChange={onChange} />
    );
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('muestra puntos suspensivos ··· cuando hay páginas intermedias', () => {
    renderWithProviders(
      <Pagination page={1} totalPages={10} onChange={vi.fn()} />
    );
    expect(screen.getByText('···')).toBeInTheDocument();
  });
});
