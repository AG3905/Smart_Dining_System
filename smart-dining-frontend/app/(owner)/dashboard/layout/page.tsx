'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { TableGrid, Table } from '@/components/TableGrid';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Plus, RefreshCw, Layers, AlertCircle, Loader2 } from 'lucide-react';

export default function OwnerFloorPlanPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Add Table Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [newCapacity, setNewCapacity] = useState('4');
  const [newRow, setNewRow] = useState('1');
  const [newCol, setNewCol] = useState('1');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Delete Confirmation Modal State
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTables = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await apiFetch<{ tables: Table[] }>('/api/tables');
      setTables(res.tables || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch floor plan tables.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch and 5-second polling interval
  useEffect(() => {
    fetchTables(false);
    const interval = setInterval(() => {
      fetchTables(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchTables]);

  // Find next available grid slot (row 1..6, col 1..6)
  const findNextOpenSlot = () => {
    const occupiedSlots = new Set(tables.map((t) => `${t.grid_row}-${t.grid_col}`));
    for (let r = 1; r <= 6; r++) {
      for (let c = 1; c <= 6; c++) {
        if (!occupiedSlots.has(`${r}-${c}`)) {
          return { row: r, col: c };
        }
      }
    }
    return { row: 1, col: 1 };
  };

  const handleOpenAddForm = () => {
    const nextSlot = findNextOpenSlot();
    setNewRow(String(nextSlot.row));
    setNewCol(String(nextSlot.col));

    // Suggest next table number (e.g. T9)
    const existingNums = tables
      .map((t) => parseInt(t.table_number.replace(/\D/g, '')))
      .filter((n) => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : tables.length + 1;
    setNewTableNum(`T${nextNum}`);

    setShowAddForm(true);
    setActionSuccess(null);
  };

  const handleAddTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNum.trim()) {
      setError('Please enter a table number.');
      return;
    }

    setSubmittingAdd(true);
    setError(null);
    setActionSuccess(null);

    try {
      await apiFetch<{ table: Table }>('/api/tables', {
        method: 'POST',
        body: JSON.stringify({
          table_number: newTableNum.trim(),
          capacity: parseInt(newCapacity, 10) || 2,
          grid_row: parseInt(newRow, 10),
          grid_col: parseInt(newCol, 10),
        }),
      });

      setActionSuccess(`Table ${newTableNum} added successfully!`);
      setShowAddForm(false);
      await fetchTables(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add table. Check position for collisions.');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleTableMove = async (tableId: string, targetRow: number, targetCol: number) => {
    setError(null);
    setActionSuccess(null);

    // Optimistic UI update
    const previousTables = [...tables];
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId ? { ...t, grid_row: targetRow, grid_col: targetCol } : t
      )
    );

    try {
      await apiFetch<{ table: Table }>(`/api/tables/${tableId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          grid_row: targetRow,
          grid_col: targetCol,
        }),
      });
      setActionSuccess('Table position updated.');
    } catch (err: any) {
      // Revert optimistic update on backend rejection (e.g. 409 collision)
      setTables(previousTables);
      setError(err.message || 'Grid position occupied! Table snapped back.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!tableToDelete) return;
    setDeleting(true);
    setError(null);
    setActionSuccess(null);

    try {
      await apiFetch(`/api/tables/${tableToDelete.id}`, {
        method: 'DELETE',
      });
      setActionSuccess(`Table ${tableToDelete.table_number} deleted.`);
      setTableToDelete(null);
      await fetchTables(false);
    } catch (err: any) {
      setError(err.message || 'Failed to delete table.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-white/10 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 bg-ember/20 text-ember rounded-full border border-ember/30">
              Screen 9
            </span>
            <span className="text-xs text-muted">Owner & Staff Operations</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-ivory flex items-center gap-2">
            <Layers className="w-6 h-6 text-ember" />
            Floor Plan & Table Layout Editor
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage physical dining tables, reposition layout via drag-and-drop, and monitor live availability.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchTables(false)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-ember' : ''}`} />
            <span>Sync</span>
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenAddForm}>
            <Plus className="w-4 h-4" />
            <span>Add Table</span>
          </Button>
        </div>
      </div>

      {/* Inline Feedback Alerts */}
      {error && (
        <Alert
          type="error"
          title="Grid Collision / Error"
          message={error}
        />
      )}

      {actionSuccess && (
        <Alert
          type="success"
          title="Success"
          message={actionSuccess}
        />
      )}

      {/* Add Table Form Modal / Section */}
      {showAddForm && (
        <div className="bg-surface-light p-6 rounded-2xl border border-ember/30 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-display font-semibold text-ivory flex items-center gap-2">
              <Plus className="w-4 h-4 text-ember" />
              Add New Dining Table
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-muted hover:text-ivory"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleAddTableSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Table Number</label>
              <input
                type="text"
                required
                value={newTableNum}
                onChange={(e) => setNewTableNum(e.target.value)}
                placeholder="e.g. T9"
                className="w-full px-3 py-2 bg-void border border-white/10 rounded-xl text-ivory placeholder-muted focus:outline-none focus:border-ember"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Seating Capacity</label>
              <input
                type="number"
                min="1"
                max="20"
                required
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                className="w-full px-3 py-2 bg-void border border-white/10 rounded-xl text-ivory focus:outline-none focus:border-ember"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Grid Row (1-6)</label>
              <input
                type="number"
                min="1"
                max="6"
                required
                value={newRow}
                onChange={(e) => setNewRow(e.target.value)}
                className="w-full px-3 py-2 bg-void border border-white/10 rounded-xl text-ivory focus:outline-none focus:border-ember"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Grid Column (1-6)</label>
              <input
                type="number"
                min="1"
                max="6"
                required
                value={newCol}
                onChange={(e) => setNewCol(e.target.value)}
                className="w-full px-3 py-2 bg-void border border-white/10 rounded-xl text-ivory focus:outline-none focus:border-ember"
              />
            </div>

            <div className="sm:col-span-4 flex justify-end space-x-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={submittingAdd}
              >
                {submittingAdd ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Table'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Main Interactive Table Grid */}
      {loading ? (
        <div className="p-12 text-center bg-surface border border-white/10 rounded-2xl">
          <Loader2 className="w-8 h-8 text-ember animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted">Loading floor plan layout...</p>
        </div>
      ) : (
        <TableGrid
          tables={tables}
          editable={true}
          onTableMove={handleTableMove}
          onTableDelete={(table) => setTableToDelete(table)}
        />
      )}

      {/* Delete Table Confirmation Modal */}
      {tableToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface border border-white/10 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-occupied-red">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-display font-bold text-ivory">Confirm Table Deletion</h3>
            </div>
            <p className="text-sm text-muted leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-ivory">Table {tableToDelete.table_number}</span> (Capacity: {tableToDelete.capacity})? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTableToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
