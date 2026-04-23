const CONFIRM_STYLES = {
  danger:  'bg-red-500 text-white hover:bg-red-600',
  primary: 'bg-sm-green-500 text-white hover:bg-sm-green-600',
};

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="min-h-screen w-full fixed inset-0 flex items-center justify-center px-4"
      style={{ zIndex: 50 }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="font-heading font-bold text-lg text-sm-dark leading-snug">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-sm-gray-500">{description}</p>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-full border border-sm-gray-200 text-sm font-semibold text-sm-dark hover:bg-sm-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors ${CONFIRM_STYLES[confirmVariant] ?? CONFIRM_STYLES.primary}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
