export default function SuperAdminRestaurantDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md">
        <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
          Screen 19
        </span>
        <h1 className="text-2xl font-bold text-white mt-3">Restaurant Detail & Admin Controls</h1>
        <p className="text-slate-400 text-sm mt-1">
          Restaurant ID: <code className="bg-slate-900 px-2 py-0.5 rounded text-indigo-400 font-mono text-xs">{params.id}</code>
        </p>
        <div className="mt-6 border-t border-slate-700 pt-4 text-slate-400 text-sm">
          Placeholder page for tenant settings override, subscription tier management, and system access control.
        </div>
      </div>
    </div>
  );
}
