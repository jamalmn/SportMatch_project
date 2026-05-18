import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

// Preset auth state for tests that require an authenticated user.
export const authenticatedUser = {
  user: { id: 'user-1', nombre: 'Test', apellidos: 'User', email: 'test@example.com' },
  token: 'fake-jwt-token',
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
};

const guestState = {
  user: null,
  token: null,
  isAuthenticated: false,
  login: vi.fn(),
  logout: vi.fn(),
};

/**
 * Renders `ui` wrapped in MemoryRouter + AuthContext.Provider.
 *
 * @param {React.ReactNode} ui
 * @param {{ initialRoute?: string, initialAuthState?: object }} options
 */
export function renderWithProviders(ui, { initialRoute = '/', initialAuthState = null } = {}) {
  const authValue = initialAuthState ?? guestState;

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthContext.Provider value={authValue}>
        {ui}
      </AuthContext.Provider>
    </MemoryRouter>
  );
}
