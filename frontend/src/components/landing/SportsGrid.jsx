import { useNavigate } from 'react-router-dom';

const SPORTS = [
  { name: 'Fútbol',      emoji: '⚽', slug: 'futbol' },
  { name: 'Baloncesto',  emoji: '🏀', slug: 'baloncesto' },
  { name: 'Pádel',       emoji: '🎾', slug: 'padel' },
  { name: 'Voleibol',    emoji: '🏐', slug: 'voleibol' },
  { name: 'Running',     emoji: '🏃', slug: 'running' },
  { name: 'Ciclismo',    emoji: '🚴', slug: 'ciclismo' },
  { name: 'Natación',    emoji: '🏊', slug: 'natacion' },
  { name: 'Otro',        emoji: '🥊', slug: 'otro' },
];

export default function SportsGrid() {
  const navigate = useNavigate();

  return (
    <section id="deportes" className="py-16 sm:py-24 bg-sm-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-sm-green-600 uppercase tracking-wide mb-1">
            Para cada afición
          </p>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-sm-dark">
            Explora por deporte
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {SPORTS.map(({ name, emoji, slug }) => (
            <button
              key={slug}
              onClick={() => navigate(`/events?deporte=${slug}`)}
              className="flex flex-col items-center gap-3 p-5 bg-white border-2 border-sm-gray-200 rounded-2xl hover:border-sm-green-400 hover:shadow-sm transition-all duration-200 cursor-pointer"
            >
              <span className="text-4xl">{emoji}</span>
              <span className="font-medium text-sm text-sm-gray-700">{name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
