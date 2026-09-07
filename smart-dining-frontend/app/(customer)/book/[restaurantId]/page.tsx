'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { UtensilsCrossed, Users, Calendar, Clock, Phone, User, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface RestaurantInfo {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  avg_dining_duration_minutes?: number;
}

export default function CustomerQRBookingPage({
  params,
}: {
  params: { restaurantId: string };
}) {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [groupSize, setGroupSize] = useState(2);
  const [bookingType, setBookingType] = useState<'instant' | 'future'>('instant');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  useEffect(() => {
    async function loadPublicInfo() {
      try {
        const res = await apiFetch<{ restaurant: RestaurantInfo }>(
          `/api/restaurants/${params.restaurantId}/public`
        );
        setRestaurant(res.restaurant);
      } catch (err: any) {
        setError(err.message || 'Restaurant not found or unavailable.');
      } finally {
        setLoading(false);
      }
    }
    loadPublicInfo();
  }, [params.restaurantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Please provide your name and phone number for SMS updates.');
      return;
    }

    if (bookingType === 'future' && (!scheduledDate || !scheduledTime)) {
      setError('Please select a date and time for your future booking.');
      return;
    }

    setSubmitting(true);
    setError(null);

    let scheduled_time: string | undefined = undefined;
    if (bookingType === 'future') {
      scheduled_time = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    }

    try {
      const res = await apiFetch<{
        reservation: { id: string; status: string };
        status: string;
        allocated: boolean;
      }>('/api/reservations', {
        method: 'POST',
        body: JSON.stringify({
          restaurant_id: params.restaurantId,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          group_size: groupSize,
          booking_type: bookingType,
          scheduled_time,
        }),
      });

      const resId = res.reservation.id;

      if (res.status === 'queued') {
        router.push(`/booking/${resId}/queue`);
      } else {
        router.push(`/booking/${resId}/confirmation`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit booking. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-void text-ivory">
        <Loader2 className="w-8 h-8 text-ember animate-spin mb-3" />
        <p className="text-sm text-muted">Loading restaurant details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-ivory p-4 sm:p-6 flex flex-col justify-between max-w-md mx-auto">
      {/* Top Bar Header */}
      <header className="pt-2 pb-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-ember/20 border border-ember/30 rounded-2xl text-ember shadow-lg shadow-ember/10">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-ember/20 text-ember rounded-full">
              Screen 1 • Smart QR Booking
            </span>
            <h1 className="text-xl font-display font-bold text-ivory mt-0.5">
              {restaurant?.name || 'Smart Dining Restaurant'}
            </h1>
            {restaurant?.address && (
              <p className="text-xs text-muted leading-tight">{restaurant.address}</p>
            )}
          </div>
        </div>
      </header>

      {/* Main Form Body */}
      <main className="py-6 space-y-5 flex-1">
        {error && <Alert type="error" message={error} />}

        {/* Toggle between Instant & Future */}
        <div className="bg-surface p-1.5 rounded-2xl border border-white/10 flex gap-1">
          <button
            type="button"
            onClick={() => setBookingType('instant')}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 min-h-[44px] ${
              bookingType === 'instant'
                ? 'bg-ember text-white shadow-md shadow-ember/20'
                : 'text-muted hover:text-ivory'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Book Now (Instant Table)</span>
          </button>
          <button
            type="button"
            onClick={() => setBookingType('future')}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 min-h-[44px] ${
              bookingType === 'future'
                ? 'bg-ember text-white shadow-md shadow-ember/20'
                : 'text-muted hover:text-ivory'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Book for Later</span>
          </button>
        </div>

        <form id="booking-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Party Size Stepper */}
          <div className="bg-surface p-4 rounded-2xl border border-white/10">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Number of Guests (Party Size)
            </label>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-ivory font-display text-lg font-bold">
                <Users className="w-5 h-5 text-ember" />
                <span>{groupSize} {groupSize === 1 ? 'Guest' : 'Guests'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setGroupSize((prev) => Math.max(1, prev - 1))}
                  className="w-11 h-11 rounded-xl bg-surface-light border border-white/10 text-ivory font-bold text-lg hover:bg-white/10 flex items-center justify-center transition active:scale-95"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setGroupSize((prev) => Math.min(20, prev + 1))}
                  className="w-11 h-11 rounded-xl bg-surface-light border border-white/10 text-ivory font-bold text-lg hover:bg-white/10 flex items-center justify-center transition active:scale-95"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Date & Time Picker for Future Bookings */}
          {bookingType === 'future' && (
            <div className="bg-surface p-4 rounded-2xl border border-ember/30 space-y-3 animate-fadeIn">
              <h4 className="text-xs font-bold text-ember uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Select Date & Time
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-muted mb-1 font-medium">Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-void border border-white/10 rounded-xl text-xs text-ivory focus:outline-none focus:border-ember"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-muted mb-1 font-medium">Time</label>
                  <input
                    type="time"
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-void border border-white/10 rounded-xl text-xs text-ivory focus:outline-none focus:border-ember"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Customer Details */}
          <div className="bg-surface p-4 rounded-2xl border border-white/10 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                Your Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-muted absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  className="w-full pl-9 pr-3 py-2.5 bg-void border border-white/10 rounded-xl text-sm text-ivory placeholder-muted focus:outline-none focus:border-ember"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                Mobile Number (for live SMS)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-muted absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +1 555 0192"
                  className="w-full pl-9 pr-3 py-2.5 bg-void border border-white/10 rounded-xl text-sm text-ivory placeholder-muted focus:outline-none focus:border-ember"
                />
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* Bottom Sticky Action Bar */}
      <footer className="pt-4 pb-2 border-t border-white/10">
        <Button
          form="booking-form"
          type="submit"
          variant="primary"
          size="lg"
          className="w-full h-12 text-base shadow-xl"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing Request...</span>
            </>
          ) : (
            <>
              <span>{bookingType === 'instant' ? 'Check Table Availability' : 'Confirm Future Booking'}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </footer>
    </div>
  );
}
