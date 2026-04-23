import { useState, useEffect } from 'react';
import api from '../../services/api';
import RatingCard from './RatingCard';
import EmptyState from '../common/EmptyState';

const LIMIT = 5;

/* ── Stars (summary size) ────────────────────────────────────────────────── */

function Stars({ value, max = 5 }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < Math.round(value) ? 'text-amber-400' : 'text-sm-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

/* ── Skeleton ────────────────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="px-4 py-4 border-b border-sm-gray-100 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-sm-gray-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <div className="h-3.5 bg-sm-gray-100 rounded w-1/3" />
            <div className="h-3.5 bg-sm-gray-100 rounded w-16" />
          </div>
          <div className="h-3 bg-sm-gray-100 rounded w-3/4" />
          <div className="h-3 bg-sm-gray-100 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

/* ── Summary with breakdown bars ────────────────────────────────────────── */

function RatingSummary({ promedio, total, ratings }) {
  const avg = Number(promedio ?? 0);

  const breakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: ratings.filter(r => r.puntuacion === star).length,
  }));

  return (
    <div className="px-4 py-4 border-b border-sm-gray-200 bg-sm-gray-50 flex flex-col sm:flex-row items-start sm:items-center gap-4">

      {/* Big average */}
      <div className="flex flex-col items-center shrink-0 min-w-[72px]">
        <span className="font-heading text-3xl font-bold text-sm-dark leading-none">
          {avg.toFixed(1)}
        </span>
        <Stars value={avg} />
        <span className="text-xs text-sm-gray-400 mt-1">{total} valoraciones</span>
      </div>

      {/* Breakdown bars */}
      <div className="flex-1 w-full space-y-1.5">
        {breakdown.map(({ star, count }) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs text-sm-gray-500 w-5 text-right shrink-0">{star}★</span>
              <div className="flex-1 h-1.5 rounded-full bg-sm-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-sm-gray-400 w-4 text-right shrink-0">{count}</span>
            </div>
          );
        })}
      </div>

    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */

export default function RatingsList({ userId }) {
  const [ratings, setRatings]       = useState([]);
  const [total, setTotal]           = useState(0);
  const [promedio, setPromedio]     = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api.get(`/api/users/${userId}/ratings?page=1&limit=${LIMIT}`)
      .then((res) => {
        setRatings(res.data.ratings ?? []);
        setTotal(res.data.total ?? 0);
        setPromedio(res.data.rating_promedio ?? 0);
      })
      .catch(() => setError('No se pudieron cargar las valoraciones.'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div>
        {Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500 text-center py-8">{error}</p>;
  }

  if (ratings.length === 0) {
    return (
      <EmptyState
        title="Sin valoraciones aún"
        description="Participa en eventos para que otros te valoren."
      />
    );
  }

  return (
    <div>
      <RatingSummary promedio={promedio} total={total} ratings={ratings} />

      <div>
        {ratings.map((r, idx) => (
          <RatingCard
            key={r.id}
            rating={r}
            isLast={idx === ratings.length - 1 && total <= LIMIT}
          />
        ))}
      </div>

      {total > LIMIT && (
        <div className="px-4 py-3 border-t border-sm-gray-100">
          <span className="text-sm font-semibold text-sm-green-600">
            Ver todas ({total}) →
          </span>
        </div>
      )}
    </div>
  );
}
