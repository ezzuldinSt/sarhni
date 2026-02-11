export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      <div className="flex flex-col items-center mb-12 space-y-4">
        <div className="w-32 h-32 rounded-full bg-leather-700" />
        <div className="h-8 w-48 bg-leather-700 rounded-lg" />
        <div className="h-4 w-64 bg-leather-800 rounded-lg" />
      </div>
      <div className="h-64 bg-leather-800 rounded-3xl mb-8 opacity-50" />
      <div className="space-y-4">
        <div className="h-32 bg-leather-700 rounded-3xl opacity-50" />
        <div className="h-32 bg-leather-700 rounded-3xl opacity-50" />
      </div>
    </div>
  );
}
