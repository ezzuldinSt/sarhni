export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-10 w-64 bg-leather-700/50 rounded-lg" />
        <div className="h-5 w-48 bg-leather-800/50 rounded-lg" />
      </div>

      {/* Share Section + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-48 bg-leather-800/30 rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
           <div className="h-24 bg-leather-800/30 rounded-3xl" />
           <div className="h-24 bg-leather-800/30 rounded-3xl" />
        </div>
      </div>

      {/* Inbox */}
      <div>
        <div className="h-8 w-32 bg-leather-800/50 rounded-lg mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="h-48 bg-leather-700/20 rounded-3xl" />
           <div className="h-48 bg-leather-700/20 rounded-3xl" />
           <div className="h-48 bg-leather-700/20 rounded-3xl" />
           <div className="h-48 bg-leather-700/20 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
