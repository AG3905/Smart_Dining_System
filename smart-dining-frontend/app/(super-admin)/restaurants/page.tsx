import Link from 'next/link';

export default function SuperAdminRestaurantsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
              Screen 18
            </span>
            <h1 className="text-2xl font-bold text-white mt-3">All Restaurants</h1>
            <p className="text-slate-400 text-sm mt-1">Platform tenant list, onboarding, and subscription controls.</p>
          </div>
          <Link
            href="/restaurants/demo-restaurant-123"
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-md font-medium transition"
          >
            View Sample Detail (Screen 19)
          </Link>
        </div>
        <div className="mt-6 border-t border-slate-700 pt-4 text-slate-400 text-sm">
          Placeholder page for global restaurant management directory.
        </div>
      </div>
    </div>
  );
}
