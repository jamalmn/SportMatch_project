export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const goTo = (p) => {
    onChange(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('ellipsis');
      acc.push(p);
      return acc;
    }, []);

  const btnBase =
    'h-9 min-w-[2.25rem] px-2 text-sm rounded-xl border transition-colors';
  const btnIdle =
    'bg-white text-sm-gray-700 border-sm-gray-200 hover:bg-sm-gray-50';
  const btnActive =
    'bg-sm-green-500 text-white border-sm-green-500';
  const btnDisabled =
    'bg-white text-sm-gray-400 border-sm-gray-200 opacity-50 cursor-not-allowed';

  return (
    <nav aria-label="Paginación" className="flex items-center justify-center gap-1.5 mt-10">
      <button
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className={`${btnBase} px-3 ${page <= 1 ? btnDisabled : btnIdle}`}
      >
        ← Anterior
      </button>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`gap-${i}`} className="px-1 text-sm-gray-400 select-none">···</span>
        ) : (
          <button
            key={p}
            onClick={() => goTo(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`${btnBase} ${p === page ? btnActive : btnIdle}`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        className={`${btnBase} px-3 ${page >= totalPages ? btnDisabled : btnIdle}`}
      >
        Siguiente →
      </button>
    </nav>
  );
}
