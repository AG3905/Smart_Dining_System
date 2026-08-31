export default function BookingConfirmationPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">Screen 2</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-3">Booking Confirmation</h1>
        <p className="text-slate-600 mt-1">Booking Reference: <code className="bg-slate-100 px-2 py-0.5 rounded text-emerald-600">{params.id}</code></p>
        <div className="mt-6 border-t pt-4 text-slate-500 text-sm">
          Placeholder page for booking confirmation status and reservation details.
        </div>
      </div>
    </div>
  );
}
