export default function CustomerBookPage({ params }: { params: { restaurantId: string } }) {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">Screen 1</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-3">Book a Table</h1>
        <p className="text-slate-600 mt-1">Restaurant ID: <code className="bg-slate-100 px-2 py-0.5 rounded text-amber-600">{params.restaurantId}</code></p>
        <div className="mt-6 border-t pt-4 text-slate-500 text-sm">
          Placeholder page for customer table reservation flow.
        </div>
      </div>
    </div>
  );
}
