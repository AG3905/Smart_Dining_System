'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { CheckCircle2, Calendar, Users, Phone, Utensils, XCircle, Loader2, ArrowRight, Smartphone } from 'lucide-react';

interface ReservationStatusResponse {
  reservation: {
    id: string;
    customer_name: string;
    customer_phone: string;
    group_size: number;
    booking_type: string;
    scheduled_time?: string;
    status: string;
    restaurant_name?: string;
  };
  allocated: boolean;
  tables?: Array<{ table_number: string; capacity: number }>;
}

export default function BookingConfirmationPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [data, setData] = useState<ReservationStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await apiFetch<ReservationStatusResponse>(`/api/reservations/${params.id}/status`);
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load booking details.');
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, [params.id]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your reservation?')) return;

    setCancelling(true);
    setError(null);

    try {
      await apiFetch(`/api/reservations/${params.id}/cancel`, {
        method: 'POST',
      });
      alert('Your booking has been cancelled.');
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to cancel reservation.');
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-void text-ivory">
        <Loader2 className="w-8 h-8 text-free-green animate-spin mb-3" />
        <p className="text-sm text-muted">Retrieving your booking confirmation...</p>
      </div>
    );
  }

  const reservation = data?.reservation;
  const table = data?.tables && data.tables.length > 0 ? data.tables[0] : null;

  return (
    <div className="min-h-screen bg-void text-ivory p-4 sm:p-6 flex flex-col justify-between max-w-md mx-auto">
      {/* Top Banner */}
      <header className="text-center pt-6 pb-4">
        <div className="w-16 h-16 bg-free-green/20 border-2 border-free-green rounded-full flex items-center justify-center mx-auto mb-3 text-free-green shadow-[0_0_20px_rgba(111,207,122,0.3)] animate-pulse">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-free-green/20 text-free-green rounded-full">
          Screen 2 • Booking Confirmed
        </span>
        <h1 className="text-2xl font-display font-extrabold text-ivory mt-2">
          {table ? 'Your Table is Ready!' : 'Booking Confirmed!'}
        </h1>
        <p className="text-xs text-muted mt-1">
          {table
            ? `Welcome! Please proceed directly to Table ${table.table_number}.`
            : 'Your reservation has been received and scheduled.'}
        </p>
      </header>

      {/* Main Details Card */}
      <main className="py-4 space-y-4 flex-1">
        {error && <Alert type="error" message={error} />}

        {/* SMS Notification Banner */}
        <div className="p-3 bg-ember/10 border border-ember/30 rounded-xl flex items-center space-x-3 text-xs text-amber-200">
          <Smartphone className="w-4 h-4 text-ember shrink-0" />
          <span>Confirmation & updates sent via SMS to <strong className="text-white">{reservation?.customer_phone}</strong></span>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4">
          {/* Reference ID */}
          <div className="border-b border-white/10 pb-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Booking Ref ID</span>
              <p className="font-mono text-sm font-bold text-amber-glow tracking-wider mt-0.5">
                #{reservation?.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            {table && (
              <div className="text-right">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Assigned Table</span>
                <p className="text-base font-display font-extrabold text-free-green">
                  Table {table.table_number}
                </p>
              </div>
            )}
          </div>

          {/* Details list */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted flex items-center gap-1.5">
                <Users className="w-4 h-4 text-ember" /> Customer Name:
              </span>
              <span className="font-bold text-ivory">{reservation?.customer_name}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted flex items-center gap-1.5">
                <Users className="w-4 h-4 text-ember" /> Party Size:
              </span>
              <span className="font-bold text-ivory">{reservation?.group_size} Guests</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-ember" /> Booking Type:
              </span>
              <span className="font-bold text-ivory uppercase">{reservation?.booking_type}</span>
            </div>

            {reservation?.scheduled_time && (
              <div className="flex items-center justify-between">
                <span className="text-muted flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-ember" /> Scheduled Time:
                </span>
                <span className="font-bold text-amber-glow">
                  {new Date(reservation.scheduled_time).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Menu & Order Preview Link (Unlocked when confirmed/seated) */}
        <div className="bg-surface-light p-4 rounded-2xl border border-ember/30 text-center space-y-3">
          <div className="flex items-center justify-center space-x-2 text-ember">
            <Utensils className="w-5 h-5" />
            <h4 className="font-display font-bold text-sm text-ivory">Ready to order?</h4>
          </div>
          <p className="text-xs text-muted">
            Browse our live menu and order dishes straight to your table.
          </p>
          <Link href={`/booking/${params.id}/menu`} className="block">
            <Button variant="primary" size="md" className="w-full">
              <span>View Digital Menu & Place Order</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer Cancel Action */}
      <footer className="pt-4 pb-2 border-t border-white/10">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full"
        >
          {cancelling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <XCircle className="w-4 h-4" />
              <span>Cancel Booking</span>
            </>
          )}
        </Button>
      </footer>
    </div>
  );
}
