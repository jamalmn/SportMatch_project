import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PRODUCTO_LINKS = [
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Eventos',       href: '/events' },
  { label: 'Deportes',      href: '#deportes' },
];

const CUENTA_GUEST = [
  { label: 'Crear cuenta',   href: '/register' },
  { label: 'Iniciar sesión', href: '/login' },
];

const CUENTA_AUTH = [
  { label: 'Dashboard',   href: '/dashboard' },
  { label: 'Mi perfil',   href: '/profile' },
  { label: 'Eventos',     href: '/events' },
  { label: 'Notificaciones', href: '/notifications' },
];

function FooterLinks({ items }) {
  return (
    <ul className="space-y-2">
      {items.map(({ label, href }) => (
        <li key={label}>
          {href.startsWith('/') ? (
            <Link to={href} className="text-sm hover:text-white transition-colors">{label}</Link>
          ) : (
            <a href={href} className="text-sm hover:text-white transition-colors">{label}</a>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="bg-sm-gray-900 text-sm-gray-400 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 mb-10">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <p className="font-heading font-bold text-white text-lg mb-2">⚽ SportMatch</p>
            <p className="text-sm leading-relaxed">
              Plataforma de eventos deportivos para amateurs. Encuentra tu próxima actividad.
            </p>
          </div>

          {/* Producto */}
          <div>
            <p className="font-semibold text-white text-sm mb-3">Producto</p>
            <FooterLinks items={PRODUCTO_LINKS} />
          </div>

          {/* Cuenta — adapts to auth state */}
          <div>
            <p className="font-semibold text-white text-sm mb-3">
              {user ? 'Mi cuenta' : 'Cuenta'}
            </p>
            <FooterLinks items={user ? CUENTA_AUTH : CUENTA_GUEST} />
          </div>

        </div>

        <div className="border-t border-sm-gray-800 pt-6 text-sm text-center">
          © {new Date().getFullYear()} SportMatch — TFG Jamal Menchi.
        </div>
      </div>
    </footer>
  );
}
