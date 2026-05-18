/**
 * LoginPage.jsx es un stub (solo renderiza un <h1>).
 * Estos tests cubren LoginForm, que es la implementación real del flujo de login,
 * y está montada dentro de AuthPage (/login).
 */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../../components/auth/LoginForm';
import * as authService from '../../services/authService';
import { renderWithProviders } from '../helpers/renderWithProviders';

vi.mock('../../services/authService', () => ({
  login: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderLoginForm() {
  return renderWithProviders(<LoginForm onSwitch={vi.fn()} />);
}

describe('LoginForm (LoginPage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza los campos de email y contraseña', () => {
    renderLoginForm();
    expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('muestra errores de validación si se hace submit con los campos vacíos', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => {
      expect(screen.getByText(/El email es obligatorio/)).toBeInTheDocument();
      expect(screen.getByText(/La contraseña es obligatoria/)).toBeInTheDocument();
    });
  });

  it('muestra error si el email tiene formato inválido', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'no-es-email');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/Formato de email inválido/)).toBeInTheDocument();
    });
  });

  it('llama a authService.login con el email y la contraseña al hacer submit', async () => {
    const user = userEvent.setup();
    authService.login.mockResolvedValue({
      data: { user: { id: '1', nombre: 'Ana' }, token: 'tok', refreshToken: 'ref' },
    });
    renderLoginForm();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Segura1234!');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('ana@example.com', 'Segura1234!');
    });
  });

  it('redirige al dashboard tras un login exitoso', async () => {
    const user = userEvent.setup();
    authService.login.mockResolvedValue({
      data: { user: { id: '1', nombre: 'Ana' }, token: 'tok', refreshToken: 'ref' },
    });
    renderLoginForm();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Segura1234!');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('muestra mensaje de error si el login falla con credenciales incorrectas (401)', async () => {
    const user = userEvent.setup();
    authService.login.mockRejectedValue({ response: { status: 401 } });
    renderLoginForm();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => {
      expect(screen.getByText('Email o contraseña incorrectos')).toBeInTheDocument();
    });
  });

  it('el botón de submit muestra "Iniciando sesión..." mientras se procesa la petición', async () => {
    const user = userEvent.setup();
    // Promise que nunca resuelve → loading queda activo
    authService.login.mockReturnValue(new Promise(() => {}));
    renderLoginForm();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Segura1234!');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => {
      expect(screen.getByText('Iniciando sesión...')).toBeInTheDocument();
    });
  });
});

// Total: 7 casos de test cubiertos
//   renderiza campos email y contraseña
//   errores de validación con campos vacíos
//   error de formato de email inválido
//   llama a authService.login con los datos correctos
//   redirige al dashboard tras login exitoso
//   muestra error si el login falla (401)
//   muestra estado loading mientras se procesa
