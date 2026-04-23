const NIVEL_LABEL = {
  principiante: 'Principiante',
  intermedio:   'Intermedio',
  avanzado:     'Avanzado',
};

const MAX_EMPTY_CIRCLES = 8;

function Avatar({ nombre, apellidos, muted = false }) {
  const initial = (nombre ?? '?').charAt(0).toUpperCase();
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
        muted
          ? 'bg-sm-gray-100 text-sm-gray-400'
          : 'bg-sm-green-200 text-sm-green-800'
      }`}
    >
      {initial}
    </div>
  );
}

function StarInline({ value }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-sm-gray-400">
      <svg className="w-3 h-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      {Number(value).toFixed(1)}
    </span>
  );
}

function ParticipantRow({ inscription, currentUserId, organizadorId, muted = false }) {
  const u          = inscription.usuario ?? {};
  const fullName   = [u.nombre, u.apellidos].filter(Boolean).join(' ') || `Usuario #${inscription.usuario_id}`;
  const isMe       = inscription.usuario_id === currentUserId;
  const isOrg      = inscription.usuario_id === organizadorId;
  const rating     = u.rating_promedio ?? null;
  const nivel      = NIVEL_LABEL[u.nivel] ?? u.nivel;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-sm-gray-50 last:border-0">
      <Avatar nombre={u.nombre} apellidos={u.apellidos} muted={muted} />

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 leading-none">
          <span className={`text-sm font-medium truncate ${muted ? 'text-sm-gray-400' : 'text-sm-dark'}`}>
            {fullName}
          </span>
          {isOrg && (
            <span className="text-xs text-sm-gray-400">(organizador)</span>
          )}
          {isMe && (
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Tú
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          {nivel && (
            <span className={`text-xs ${muted ? 'text-sm-gray-300' : 'text-sm-gray-400'}`}>
              {nivel}
            </span>
          )}
          {rating != null && Number(rating) > 0 && !muted && (
            <StarInline value={rating} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ParticipantsList({ inscriptions, currentUserId, organizadorId, aforoMaximo }) {
  const confirmed = inscriptions.filter(i => i.estado === 'confirmed');
  const waiting   = inscriptions.filter(i => i.estado === 'waiting');

  const plazasLibres = aforoMaximo != null
    ? Math.max(0, aforoMaximo - confirmed.length)
    : 0;

  const emptyVisible = Math.min(plazasLibres, MAX_EMPTY_CIRCLES);
  const emptyExtra   = plazasLibres - emptyVisible;

  return (
    <div className="bg-white border border-sm-gray-200 rounded-2xl p-5 space-y-5">

      {/* ── Confirmados ───────────────────────────────── */}
      <section>
        <h2 className="font-heading font-semibold text-sm-dark text-sm mb-1">
          Confirmados ({confirmed.length}
          {aforoMaximo != null ? `/${aforoMaximo}` : ''})
        </h2>

        {confirmed.length === 0 ? (
          <p className="text-sm text-sm-gray-400 py-2">Sin inscritos confirmados aún.</p>
        ) : (
          <div>
            {confirmed.map(i => (
              <ParticipantRow
                key={i.id}
                inscription={i}
                currentUserId={currentUserId}
                organizadorId={organizadorId}
              />
            ))}
          </div>
        )}

        {/* Plazas vacías */}
        {plazasLibres > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {Array.from({ length: emptyVisible }).map((_, idx) => (
              <div
                key={idx}
                className="w-9 h-9 rounded-full border-2 border-dashed border-sm-gray-200 shrink-0"
              />
            ))}
            {emptyExtra > 0 && (
              <span className="text-xs text-sm-gray-400">+{emptyExtra} más</span>
            )}
            <span className="w-full text-xs text-sm-gray-400 mt-0.5">
              {plazasLibres} plaza{plazasLibres !== 1 ? 's' : ''} libre{plazasLibres !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </section>

      {/* ── Lista de espera ───────────────────────────── */}
      {waiting.length > 0 && (
        <section className="border-t border-sm-gray-100 pt-4">
          <h2 className="font-heading font-semibold text-sm-gray-500 text-sm mb-1">
            En lista de espera ({waiting.length})
          </h2>
          <div>
            {waiting
              .slice()
              .sort((a, b) => (a.posicion_espera ?? 0) - (b.posicion_espera ?? 0))
              .map(i => (
                <ParticipantRow
                  key={i.id}
                  inscription={i}
                  currentUserId={currentUserId}
                  organizadorId={organizadorId}
                  muted
                />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
