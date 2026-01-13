export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-green-900 to-emerald-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-yellow-600/30 rounded-full" />
          <div className="absolute inset-0 border-4 border-yellow-400 rounded-full border-t-transparent animate-spin" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-yellow-100 mb-2">Loading...</h2>
        <p className="text-yellow-100/60">Preparing your table</p>
      </div>
    </div>
  );
}
