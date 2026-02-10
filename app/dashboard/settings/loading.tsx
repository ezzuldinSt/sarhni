export default function SettingsLoading() {
  return (
    <div className="max-w-xl mx-auto animate-pulse">
      <div className="h-10 w-48 bg-leather-700/50 rounded-lg mb-8" />
      <div className="bg-leather-800/30 rounded-3xl p-8 space-y-6">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="w-32 h-32 rounded-full bg-leather-700/50" />
          <div className="h-9 w-32 bg-leather-700/50 rounded-lg" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-12 bg-leather-700/50 rounded" />
          <div className="h-24 bg-leather-900/50 rounded-xl" />
        </div>
        <div className="h-12 bg-leather-700/50 rounded-xl" />
      </div>
    </div>
  );
}
