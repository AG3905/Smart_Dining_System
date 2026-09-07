'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Clock, Users, RefreshCw, XCircle, Loader2, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';

interface QueueStatusResponse {
  reservation: {
    id: string;
    customer_name: string;
    customer_phone: string;
    group_size: number;
    status: string;
    restaurant_name?: string;
  };
  allocated: boolean;
  queuePosition: number;
  estimatedWaitMinutes: number;
}

export default function WaitingQueuePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [data, setData] = useState<QueueStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkQueueStatus = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await apiFetch<QueueStatusResponse>(`/api/reservations/${params.id}/status`);
      setData(res);

      // Auto-redirect if table gets allocated / status flips to confirmed or seated
      if (res.allocated || ['confirmed', 'seated'].includes(res.reservation.status)) {
        router.push(`/booking/${params.id}/confirmation`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sync queue status.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params.id, router]);

  // Poll status every 5 seconds
  useEffect(() => {
    checkQueueStatus(false);
    const interval = setInterval(() => {
      checkQueueStatus(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [checkQueueStatus]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to leave the queue and cancel your reservation?')) return;

    setCancelling(true);
    setError(null);

    try {
      await apiFetch(`/api/reservations/${params.id}/cancel`, {
        method: 'POST',
      });
      alert('You have left the queue.');
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to cancel reservation.');
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-void text-ivory">
        <Loader2 className="w-8 h-8 text-amber-glow animate-spin mb-3" />
        <p className="text-sm text-muted">Joining live waitlist...</p>
      </div>
    );
  }

  const reservation = data?.reservation;
  const queuePos = data?.queuePosition || 1;
  const estWait = data?.estimatedWaitMinutes || 10;

  return (
    <div className="min-h-screen bg-void text-ivory p-4 sm:p-6 flex flex-col justify-between max-w-md mx-auto">
      {/* Top Banner */}
      <header className="text-center pt-6 pb-2">
        {/* Glowing Animated Ring */}
        <div className="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-amber-glow/20 animate-ping"></div>
          <div className="w-20 h-20 bg-amber-glow/20 border-2 border-amber-glow rounded-full flex items-center justify-center text-amber-glow shadow-[0_0_25px_rgba(255,180,84,0.3)]">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-amber-glow/20 text-amber-glow rounded-full">
          Screen 3 • Live Waitlist Queue
        </span>
        <h1 className="text-2xl font-display font-bold text-ivory mt-2">
          You are in Line!
        </h1>
        <p className="text-xs text-muted mt-1">
          {reservation?.restaurant_name || 'Smart Dining Restaurant'} • Live Queue Tracker
        </p>
      </header>

      {/* Main Wait Card */}
      <main className="py-4 space-y-4 flex-1">
        {error && <Alert type="error" message={error} />}

        {/* Queue Position Box */}
        <div className="bg-surface p-6 rounded-2xl border border-amber-glow/30 shadow-2xl text-center space-y-4 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-glow/10 rounded-full blur-xl pointer-events-none"></div>

          <div>
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Your Position</span>
            <div className="text-5xl font-display font-extrabold text-amber-glow my-1 tracking-tight">
              #{queuePos}
            </div>
            <p className="text-xs text-ivory font-medium">in queue waitlist</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 text-xs">
            <div className="bg-surface-light p-3 rounded-xl border border-white/5">
              <span className="text-muted block text-[10px] uppercase tracking-wider">Est. Wait Time</span>
              <span className="font-bold text-ivory text-sm mt-0.5 block flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-glow" />
                ~{estWait} mins
              </span>
            </div>

            <div className="bg-surface-light p-3 rounded-xl border border-white/5">
              <span className="text-muted block text-[10px] uppercase tracking-wider">Party Size</span>
              <span className="font-bold text-ivory text-sm mt-0.5 block flex items-center justify-center gap-1">
                <Users className="w-3.5 h-3.5 text-ember" />
                {reservation?.group_size} Guests
              </span>
            </div>
          </div>
        </div>

        {/* SMS Alert Info */}
        <div className="p-3.5 bg-surface-light border border-white/10 rounded-xl flex items-center space-x-3 text-xs text-muted">
          <Smartphone className="w-4 h-4 text-ember shrink-0" />
          <span>We will send an SMS to <strong className="text-ivory">{reservation?.customer_phone}</strong> as soon as your table is ready!</span>
        </div>

        {/* Auto Sync indicator */}
        <div className="flex items-center justify-center space-x-2 text-[11px] text-muted pt-2">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-glow' : ''}`} />
          <span>Auto-syncing position every 5s...</span>
        </div>
      </main>

      {/* Bottom Footer Actions */}
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
              <span>Leave Queue & Cancel</span>
            </>
          )}
        </Button>
      </footer>
    </div>
  );
}
