export default function OwnerLoading() {
  return (
    <div className="max-w-4xl mx-auto py-10 border-4 border-yellow-500/20 p-8 rounded-3xl animate-pulse">
      <div className="h-12 w-72 bg-yellow-500/20 rounded-lg mb-2" />
      <div className="h-5 w-80 bg-leather-800/50 rounded-lg mb-8" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-leather-800/30 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-leather-700/50" />
              <div className="space-y-2">
                <div className="h-4 w-28 bg-leather-700/50 rounded" />
                <div className="h-3 w-16 bg-leather-800/50 rounded" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-16 bg-leather-700/50 rounded-lg" />
              <div className="h-8 w-16 bg-leather-700/50 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
