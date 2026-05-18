import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import PrivateRoute from '../../components/common/PrivateRoute';
import { renderWithProviders } from '../helpers/renderWithProviders';

const ProtectedContent = () => <div>Contenido protegido</div>;
const FakeLoginPage    = () => <div>Página de login</div>;

function renderProtected(isAuthenticated) {
  const authState = {
    user:            isAuthenticated ? { id: '1', nombre: 'Test' } : null,
    token:           isAuthenticated ? 'token' : null,
    isAuthenticated,
    login:           vi.fn(),
    logout:          vi.fn(),
  };

  return renderWithProviders(
    <Routes>
      <Route
        path="/"
        element={
          <PrivateRoute>
            <ProtectedContent />
          </PrivateRoute>
        }
      />
      <Route path="/login" element={<FakeLoginPage />} />
    </Routes>,
    { initialRoute: '/', initialAuthState: authState }
  );
}

describe('PrivateRoute (ProtectedRoute)', () => {
  it('redirige a /login y no muestra el contenido si el usuario no está autenticado', () => {
    renderProtected(false);
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
    expect(screen.getByText('Página de login')).toBeInTheDocument();
  });

  it('renderiza los children si el usuario está autenticado', () => {
    renderProtected(true);
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
    expect(screen.queryByText('Página de login')).not.toBeInTheDocument();
  });
});

// Total: 2 casos de test cubiertos
//   redirige a /login si no autenticado
//   renderiza children si autenticado
