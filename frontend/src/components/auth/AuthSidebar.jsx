const BENEFITS = [
  {
    icon: '🏆',
    title: 'Eventos cerca de ti',
    description: 'Filtramos por tu ciudad para que solo veas partidos a los que puedes ir.',
  },
  {
    icon: '⚡',
    title: 'Unión en segundos',
    description: 'Encuentra un evento, elige tu nivel y únete con un solo clic.',
  },
  {
    icon: '⭐',
    title: 'Comunidad valorada',
    description: 'Sistema de valoraciones para garantizar buenas experiencias en cada partido.',
  },
];

const AVATARS = ['JM', 'AL', 'CR', 'PL', 'MG'];

export default function AuthSidebar() {
  return (
    <aside className="hidden lg:flex flex-col justify-between w-2/5 min-h-screen bg-sm-dark px-12 py-16">
      <div>
        <div className="flex items-center gap-2 mb-16">
          <span className="text-2xl">⚽</span>
          <span className="text-white font-heading font-bold text-xl">SportMatch</span>
        </div>

        <h1 className="text-white font-heading font-bold text-4xl leading-tight mb-4">
          Tu próximo partido te está esperando.
        </h1>
        <p className="text-sm-gray-400 text-lg mb-12">
          Conecta con deportistas de tu nivel, únete a eventos cerca de ti y
          disfruta del deporte amateur.
        </p>

        <ul className="space-y-8">
          {BENEFITS.map((b) => (
            <li key={b.title} className="flex gap-4">
              <span className="text-2xl mt-0.5 shrink-0">{b.icon}</span>
              <div>
                <p className="text-white font-semibold mb-1">{b.title}</p>
                <p className="text-sm-gray-400 text-sm leading-relaxed">{b.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-3 mt-12">
        <div className="flex -space-x-2">
          {AVATARS.map((initials) => (
            <div
              key={initials}
              className="w-8 h-8 rounded-full bg-sm-green-600 border-2 border-sm-dark flex items-center justify-center"
            >
              <span className="text-white text-xs font-semibold">{initials}</span>
            </div>
          ))}
        </div>
        <p className="text-sm-gray-400 text-sm">+1.200 deportistas ya usan SportMatch</p>
      </div>
    </aside>
  );
}
