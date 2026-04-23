const COLORS = ['', '#ef4444', '#f97316', '#eab308', '#16b858'];
const LABELS = ['', 'Muy débil', 'Débil', 'Aceptable', 'Fuerte'];

function calcScore(password) {
  return [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
}

export default function PasswordStrength({ password }) {
  if (!password) return null;

  const score = calcScore(password);
  const color = COLORS[score];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= score ? color : '#dce2de' }}
          />
        ))}
      </div>
      {score > 0 && (
        <p className="text-xs font-medium" style={{ color }}>
          {LABELS[score]}
        </p>
      )}
    </div>
  );
}
