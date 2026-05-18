// Adapted from Modal.test.jsx — ConfirmModal is the modal component in this project.
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmModal from '../../components/common/ConfirmModal';

const baseProps = {
  isOpen: true,
  title: '¿Confirmar acción?',
  description: 'Esta acción no se puede deshacer.',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe('ConfirmModal', () => {
  beforeEach(() => {
    baseProps.onConfirm.mockClear();
    baseProps.onCancel.mockClear();
  });

  it('no se renderiza cuando isOpen=false', () => {
    render(<ConfirmModal {...baseProps} isOpen={false} />);
    expect(screen.queryByText('¿Confirmar acción?')).not.toBeInTheDocument();
  });

  it('se renderiza con título y descripción cuando isOpen=true', () => {
    render(<ConfirmModal {...baseProps} />);
    expect(screen.getByText('¿Confirmar acción?')).toBeInTheDocument();
    expect(screen.getByText('Esta acción no se puede deshacer.')).toBeInTheDocument();
  });

  it('llama a onConfirm al hacer click en el botón de confirmación', () => {
    render(<ConfirmModal {...baseProps} confirmLabel="Eliminar" />);
    fireEvent.click(screen.getByText('Eliminar'));
    expect(baseProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('llama a onCancel al hacer click en el overlay (backdrop)', () => {
    const { container } = render(<ConfirmModal {...baseProps} />);
    const overlay = container.querySelector('[aria-hidden="true"]');
    fireEvent.click(overlay);
    expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('no llama a onCancel al hacer click dentro del contenido del modal', () => {
    render(<ConfirmModal {...baseProps} />);
    fireEvent.click(screen.getByText('¿Confirmar acción?'));
    expect(baseProps.onCancel).not.toHaveBeenCalled();
  });
});
