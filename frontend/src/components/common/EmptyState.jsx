export default function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <svg
        className="w-16 h-16 text-sm-gray-300 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
        />
      </svg>

      {title && (
        <h3 className="font-heading font-semibold text-lg text-sm-dark mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-sm-gray-500 max-w-sm mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-sm-green-500 rounded-xl hover:bg-sm-green-600 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
