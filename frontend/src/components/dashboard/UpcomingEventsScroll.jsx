import { useNavigate } from 'react-router-dom';
import UpcomingEventCard from './UpcomingEventCard';

function SkeletonCard() {
  return (
    <div className="w-[200px] shrink-0 rounded-2xl border border-sm-gray-200 bg-white overflow-hidden animate-pulse">
      <div className="h-14 bg-sm-gray-100" />
      <div className="px-3 py-3 space-y-2">
        <div className="h-3.5 bg-sm-gray-100 rounded w-3/4" />
        <div className="h-3 bg-sm-gray-100 rounded w-1/2" />
        <div className="h-3 bg-sm-gray-100 rounded w-2/3" />
      </div>
    </div>
  );
}

function SearchMoreCard({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-[200px] shrink-0 rounded-2xl border-2 border-dashed border-sm-gray-300 bg-transparent hover:border-sm-green-400 hover:bg-sm-green-50 transition-colors flex flex-col items-center justify-center gap-2 px-4 py-6"
    >
      <span className="text-2xl">🔍</span>
      <span className="text-sm font-semibold text-sm-gray-500">Buscar más</span>
    </button>
  );
}

export default function UpcomingEventsScroll({ events, loading }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-sm-gray-200 rounded-2xl overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <h2 className="font-heading font-semibold text-sm-dark text-base">Próximos eventos</h2>
      </div>

      {loading ? (
        <div className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-hide">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <>
          <div className="flex gap-3 px-4 pb-2 overflow-x-auto scrollbar-hide">
            {events.map(ins => (
              <UpcomingEventCard key={ins.id} inscription={ins} />
            ))}
            <SearchMoreCard onClick={() => navigate('/events')} />
          </div>
          {events.length > 0 && (
            <p className="sm:hidden text-xs text-sm-gray-400 text-center pb-3">
              ← Desliza para ver más
            </p>
          )}
        </>
      )}
    </div>
  );
}
