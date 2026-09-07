'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { TableGrid, Table } from '@/components/TableGrid';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Users, Crown, Plus, RefreshCw, Clock, Layers, Loader2, Sparkles } from 'lucide-react';

interface QueueItem {
  id: string;
  reservation_id: string;
  customer_name: string;
  customer_phone: string;
  group_size: number;
  priority_score: number;
  is_vip: boolean;
  joined_at: string;
  status: string;
}

export default function OwnerLiveQueuePage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Add Walk-in Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinSize, setWalkinSize] = useState('2');
  const [submittingWalkin, setSubmittingWalkin] = useState(false);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [tRes, qRes] = await Promise.all([
        apiFetch<{ tables: Table[] }>('/api/tables'),
        apiFetch<{ queue: QueueItem[] }>('/api/waiting-queue'),
      ]);
      setTables(tRes.tables || []);
      setQueue(qRes.queue || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to sync queue and floor plan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);
    const interval = setInterval(() => {
      fetchData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleMarkVip = async (queueId: string, customerName: string) => {
    setError(null);
    setActionSuccess(null);

    try {
      const res = await apiFetch<{ message: string }>(`/api/waiting-queue/${queueId}/vip`, {
        method: 'PATCH',
      });
      setActionSuccess(`VIP Fast-forward applied for ${customerName}! ${res.message}`);
      await fetchData(false);
    } catch (err: any) {
      setError(err.message || 'Failed to apply VIP fast-forward.');
    }
  };

  const handleAddWalkinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinName.trim() || !walkinPhone.trim()) {
      setError('Please provide customer name and phone.');
      return;
    }

    setSubmittingWalkin(true);
    setError(null);
    setActionSuccess(null);

    try {
      // Get restaurant ID from first table or store
      const restId = tables[0]?.restaurant_id;
      if (!restId) {
        throw new Error('Restaurant ID unavailable');
      }

      const res = await apiFetch<{ message: string; status: string; table?: Table }>('/api/reservations', {
        method: 'POST',
        body: JSON.stringify({
          restaurant_id: restId,
          customer_name: walkinName.trim(),
          customer_phone: walkinPhone.trim(),
          group_size: parseInt(walkinSize, 10) || 2,
          booking_type: 'instant',
          created_by: 'staff',
        }),
      });

      setActionSuccess(res.table ? `Walk-in seated immediately at Table ${res.table.table_number}!` : 'Walk-in added to waitlist queue.');
      setShowAddModal(false);
      setWalkinName('');
      setWalkinPhone('');
      await fetchData(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add walk-in booking.');
    } font: {
      setSubmittingWalkin(false);
    }
  };

  // Helper to compute live ticking wait duration in minutes
  const getWaitMinutes = (joinedAt: string) => {
    const start = new Date(joinedAt).getTime();
    const now = new Date().getTime();
    return Math.max(0, Math.floor((now - start) / 60000));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-white/10 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 bg-ember/20 text-ember rounded-full border border-ember/30">
              Screen 10
            </span>
            <span className="text-xs text-muted">Operations Floor View</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-ivory flex items-center gap-2">
            <Layers className="w-6 h-6 text-ember" />
            Live Queue & Floor Plan Control
          </h1>
          <p className="text-sm text-muted mt-1">
            Real-time split view of live waitlist allocation and floor plan table statuses.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="secondary" size="sm" onClick={() => fetchData(false)} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-ember' : ''}`} />
            <span>Sync</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            <span>Add Walk-in Booking</span>
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {error && <Alert type="error" message={error} />}
      {actionSuccess && <Alert type="success" message={actionSuccess} />}

      {/* Add Walk-in Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface border border-white/10 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-display font-bold text-ivory flex items-center gap-2">
                <Plus className="w-5 h-5 text-ember" />
                Add Walk-in / Phone Reservation
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-xs text-muted hover:text-ivory">
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddWalkinSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-void border border-white/10 rounded-xl text-ivory focus:outline-none focus:border-ember"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Phone Number (SMS)</label>
                <input
                  type="tel"
                  required
                  value={walkinPhone}
                  onChange={(e) => setWalkinPhone(e.target.value)}
                  placeholder="e.g. +1 555 0192"
                  className="w-full px-3 py-2 bg-void border border-white/10 rounded-xl text-ivory focus:outline-none focus:border-ember"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Party Size (Guests)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={walkinSize}
                  onChange={(e) => setWalkinSize(e.target.value)}
                  className="w-full px-3 py-2 bg-void border border-white/10 rounded-xl text-ivory focus:outline-none focus:border-ember"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submittingWalkin}>
                  {submittingWalkin ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Booking'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Split View Layout */}
      {loading ? (
        <div className="p-12 text-center bg-surface border border-white/10 rounded-2xl">
          <Loader2 className="w-8 h-8 text-ember animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted">Loading live floor plan & waiting queue...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Floor Plan View (Read-Only) */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="text-sm font-display font-semibold text-ivory flex items-center justify-between">
              <span>Live Floor Plan Layout</span>
              <span className="text-xs text-muted font-normal">{tables.length} Total Tables</span>
            </h3>
            <TableGrid tables={tables} editable={false} />
          </div>

          {/* Right Column: Waiting Queue List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-display font-semibold text-ivory flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-glow" />
                Live Waitlist Queue
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 bg-amber-glow/20 text-amber-glow rounded-full">
                {queue.length} Waiting
              </span>
            </div>

            {queue.length === 0 ? (
              <div className="bg-surface p-8 border border-white/10 rounded-2xl text-center">
                <Sparkles className="w-8 h-8 text-free-green mx-auto mb-2 opacity-60" />
                <h4 className="text-sm font-bold text-ivory">Waitlist Empty</h4>
                <p className="text-xs text-muted mt-1">No customers currently waiting in queue.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {queue.map((item, idx) => {
                  const waitMins = getWaitMinutes(item.joined_at);

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        item.is_vip
                          ? 'bg-amber-glow/10 border-amber-glow/40 shadow-lg shadow-amber-glow/5'
                          : 'bg-surface border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono font-bold text-amber-glow">#{idx + 1}</span>
                            <h4 className="font-display font-bold text-sm text-ivory">{item.customer_name}</h4>
                            {item.is_vip && (
                              <span className="flex items-center space-x-1 text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-glow text-void rounded-full">
                                <Crown className="w-3 h-3 fill-current" />
                                <span>VIP</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted mt-0.5">{item.customer_phone}</p>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-ember flex items-center justify-end gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {item.group_size} Guests
                          </span>
                          <span className="text-[10px] text-muted block mt-0.5">
                            Wait: {waitMins}m
                          </span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-muted font-mono">
                          Score: {Math.round(item.priority_score)}
                        </span>

                        {!item.is_vip && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkVip(item.id, item.customer_name)}
                            className="py-1 px-2.5 text-[11px]"
                          >
                            <Crown className="w-3 h-3 text-amber-glow" />
                            <span>Mark VIP</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
