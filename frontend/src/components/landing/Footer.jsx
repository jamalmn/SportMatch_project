import { Link } from 'react-router-dom';

const LINKS = {
  Producto: [
    { label: 'Cómo funciona', href: '#como-funciona' },
    { label: 'Eventos',       href: '/events' },
    { label: 'Deportes',      href: '#deportes' },
  ],
  Cuenta: [
    { label: 'Crear cuenta',   href: '/register' },
    { label: 'Iniciar sesión', href: '/login' },
  ],
  Legal: [
    { label: 'Privacidad',     href: '#' },
    { label: 'Términos de uso', href: '#' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-sm-gray-900 text-sm-gray-400 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <p className="font-heading font-bold text-white text-lg mb-2">⚽ SportMatch</p>
            <p className="text-sm leading-relaxed">
              Plataforma de eventos deportivos para amateurs. Encuentra tu próxima actividad.
            </p>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([section, items]) => (
            <div key={section}>
              <p className="font-semibold text-white text-sm mb-3">{section}</p>
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
            </div>
          ))}
        </div>

        <div className="border-t border-sm-gray-800 pt-6 text-sm text-center">
          © {new Date().getFullYear()} SportMatch — TFG Jamal Menchi.
        </div>
      </div>
    </footer>
  );
}
