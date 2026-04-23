export default function SkeletonCard() {
  return (
    <div className="bg-white border border-sm-gray-200 rounded-2xl p-4 flex flex-col gap-3 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="w-8 h-8 bg-sm-gray-200 rounded" />
        <div className="w-16 h-5 bg-sm-gray-200 rounded-full" />
      </div>
      <div className="h-4 bg-sm-gray-200 rounded w-3/4" />
      <div className="h-4 bg-sm-gray-200 rounded w-1/2" />
      <div className="h-4 bg-sm-gray-200 rounded w-2/3" />
      <div className="flex items-center justify-between pt-2 border-t border-sm-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-sm-gray-200 rounded-full" />
          <div className="w-20 h-4 bg-sm-gray-200 rounded-full" />
        </div>
        <div className="w-16 h-4 bg-sm-gray-200 rounded" />
      </div>
    </div>
  );
}
