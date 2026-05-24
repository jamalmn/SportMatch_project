import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/login');
  };

  const initial = user?.nombre?.charAt(0).toUpperCase() ?? '?';

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-sm-gray-200">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-heading font-bold text-lg text-sm-dark">
          <span className="text-2xl">⚽</span>
          <span>SportMatch</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-6 text-sm font-medium text-sm-gray-700">
          {!isAuthenticated ? (
            <>
              <li><a href="#como-funciona" className="hover:text-sm-green-600 transition-colors">Cómo funciona</a></li>
              <li><Link to="/events" className="hover:text-sm-green-600 transition-colors">Eventos</Link></li>
              <li><a href="#deportes" className="hover:text-sm-green-600 transition-colors">Deportes</a></li>
            </>
          ) : (
            <>
              <li><Link to="/events" className="hover:text-sm-green-600 transition-colors">Eventos</Link></li>
              <li><Link to="/dashboard" className="hover:text-sm-green-600 transition-colors">Dashboard</Link></li>
            </>
          )}
        </ul>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-sm-gray-700 border border-sm-gray-200 rounded-xl hover:bg-sm-gray-50 transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-sm-green-500 rounded-xl hover:bg-sm-green-600 transition-colors"
              >
                Crear cuenta
              </Link>
            </>
          ) : (
            <>
              {/* Bell */}
              <button
                onClick={() => navigate('/notifications')}
                className="relative p-2 text-sm-gray-500 hover:text-sm-gray-800 transition-colors"
                aria-label="Notificaciones"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>

              {/* Avatar + dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-9 h-9 rounded-full bg-sm-green-500 text-white text-sm font-semibold flex items-center justify-center hover:bg-sm-green-600 transition-colors"
                >
                  {initial}
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-sm-gray-200 rounded-xl shadow-lg py-1 z-50">
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-sm-gray-700 hover:bg-sm-gray-50"
                    >
                      Ver perfil
                    </Link>
                    <button
                      onMouseDown={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-sm-gray-50"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-sm-gray-700"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menú"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-sm-gray-200 bg-white px-4 py-4 space-y-3">
          {!isAuthenticated ? (
            <>
              <a href="#como-funciona" className="block text-sm-gray-700 font-medium py-1" onClick={() => setMenuOpen(false)}>Cómo funciona</a>
              <Link to="/events" className="block text-sm-gray-700 font-medium py-1" onClick={() => setMenuOpen(false)}>Eventos</Link>
              <a href="#deportes" className="block text-sm-gray-700 font-medium py-1" onClick={() => setMenuOpen(false)}>Deportes</a>
              <div className="pt-3 flex flex-col gap-2">
                <Link to="/login" className="w-full text-center py-2 text-sm font-semibold text-sm-gray-700 border border-sm-gray-200 rounded-xl" onClick={() => setMenuOpen(false)}>
                  Iniciar sesión
                </Link>
                <Link to="/register" className="w-full text-center py-2 text-sm font-semibold text-white bg-sm-green-500 rounded-xl" onClick={() => setMenuOpen(false)}>
                  Crear cuenta
                </Link>
              </div>
            </>
          ) : (
            <>
              <Link to="/events" className="block text-sm-gray-700 font-medium py-1" onClick={() => setMenuOpen(false)}>Eventos</Link>
              <Link to="/dashboard" className="block text-sm-gray-700 font-medium py-1" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/notifications" className="block text-sm-gray-700 font-medium py-1" onClick={() => setMenuOpen(false)}>Notificaciones</Link>
              <Link to="/profile" className="block text-sm-gray-700 font-medium py-1" onClick={() => setMenuOpen(false)}>Ver perfil</Link>
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="block text-red-600 font-medium py-1 text-left">
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
