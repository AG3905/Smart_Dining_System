'use client';

import React, { useState } from 'react';
import { Users, Trash2, Edit3, Move, Check } from 'lucide-react';

export interface Table {
  id: string;
  restaurant_id: string;
  table_number: string;
  capacity: number;
  grid_row: number;
  grid_col: number;
  status: 'free' | 'occupied' | 'reserved';
  order_status?: string | null;
  seated_at?: string | null;
}

interface TableGridProps {
  tables: Table[];
  editable?: boolean;
  onTableMove?: (tableId: string, newRow: number, newCol: number) => void;
  onTableSelect?: (table: Table) => void;
  onTableDelete?: (table: Table) => void;
  selectedTableId?: string | null;
  maxRows?: number;
  maxCols?: number;
}

export function TableGrid({
  tables,
  editable = false,
  onTableMove,
  onTableSelect,
  onTableDelete,
  selectedTableId,
  maxRows = 6,
  maxCols = 6,
}: TableGridProps) {
  const [draggedTableId, setDraggedTableId] = useState<string | null>(null);

  // Map tables by grid coordinate key "row-col"
  const tableMap = new Map<string, Table>();
  tables.forEach((t) => {
    tableMap.set(`${t.grid_row}-${t.grid_col}`, t);
  });

  const handleDragStart = (e: React.DragEvent, tableId: string) => {
    if (!editable) return;
    setDraggedTableId(tableId);
    e.dataTransfer.setData('text/plain', tableId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!editable) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetRow: number, targetCol: number) => {
    if (!editable) return;
    e.preventDefault();
    const tableId = e.dataTransfer.getData('text/plain') || draggedTableId;
    if (tableId && onTableMove) {
      onTableMove(tableId, targetRow, targetCol);
    }
    setDraggedTableId(null);
  };

  const rows = Array.from({ length: maxRows }, (_, i) => i + 1);
  const cols = Array.from({ length: maxCols }, (_, i) => i + 1);

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-[600px] p-6 bg-surface/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md">
        
        {/* Header Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10 text-xs">
          <div className="flex items-center space-x-5">
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded-full bg-free-green shadow-[0_0_10px_rgba(111,207,122,0.4)]"></span>
              <span className="text-ivory font-semibold">Free</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded-full bg-occupied-red shadow-[0_0_10px_rgba(225,70,44,0.4)]"></span>
              <span className="text-ivory font-semibold">Occupied</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-glow shadow-[0_0_10px_rgba(255,180,84,0.4)]"></span>
              <span className="text-ivory font-semibold">Reserved</span>
            </div>
          </div>

          {editable && (
            <div className="text-muted flex items-center space-x-1.5 bg-void/50 px-3 py-1.5 rounded-lg border border-white/5">
              <Move className="w-3.5 h-3.5 text-ember" />
              <span>Drag & drop tables to update position</span>
            </div>
          )}
        </div>

        {/* CSS Grid */}
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${maxRows}, minmax(90px, auto))`,
          }}
        >
          {rows.map((r) =>
            cols.map((c) => {
              const cellKey = `${r}-${c}`;
              const table = tableMap.get(cellKey);
              const isSelected = table && table.id === selectedTableId;

              // Color styles based on status
              let statusStyle = 'border-dashed border-white/10 hover:border-white/20 bg-void/30';
              if (table) {
                if (table.status === 'free') {
                  statusStyle = 'bg-free-green/10 border-free-green/50 text-free-green hover:bg-free-green/20 shadow-lg shadow-free-green/5';
                } else if (table.status === 'occupied') {
                  statusStyle = 'bg-occupied-red/10 border-occupied-red/50 text-occupied-red hover:bg-occupied-red/20 shadow-lg shadow-occupied-red/5';
                } else if (table.status === 'reserved') {
                  statusStyle = 'bg-amber-glow/10 border-amber-glow/50 text-amber-glow hover:bg-amber-glow/20 shadow-lg shadow-amber-glow/5';
                }
              }

              return (
                <div
                  key={cellKey}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, r, c)}
                  onClick={() => table && onTableSelect && onTableSelect(table)}
                  className={`relative rounded-xl border p-3 min-h-[96px] flex flex-col justify-between transition-all duration-200 ${statusStyle} ${
                    isSelected ? 'ring-2 ring-ember ring-offset-2 ring-offset-void scale-[1.02]' : ''
                  } ${editable && table ? 'cursor-grab active:cursor-grabbing' : table ? 'cursor-pointer' : ''}`}
                  draggable={editable && !!table}
                  onDragStart={(e) => table && handleDragStart(e, table.id)}
                >
                  {table ? (
                    <>
                      {/* Table Header */}
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-sm text-ivory tracking-wide">
                          Table {table.table_number}
                        </span>
                        <span className="flex items-center space-x-1 text-[11px] font-semibold text-muted bg-surface/80 px-2 py-0.5 rounded-md border border-white/5">
                          <Users className="w-3 h-3 text-ember" />
                          <span>{table.capacity}</span>
                        </span>
                      </div>

                      {/* Status / Details */}
                      <div className="mt-2 flex items-end justify-between">
                        <div>
                          <span
                            className={`inline-block text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                              table.status === 'free'
                                ? 'bg-free-green/20 text-free-green'
                                : table.status === 'occupied'
                                ? 'bg-occupied-red/20 text-occupied-red'
                                : 'bg-amber-glow/20 text-amber-glow'
                            }`}
                          >
                            {table.status}
                          </span>
                          {table.order_status && (
                            <p className="text-[10px] text-muted font-medium capitalize mt-1">
                              {table.order_status}
                            </p>
                          )}
                        </div>

                        {/* Editable Actions */}
                        {editable && (
                          <div className="flex items-center space-x-1">
                            {onTableDelete && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTableDelete(table);
                                }}
                                className="p-1 text-muted hover:text-occupied-red hover:bg-occupied-red/10 rounded transition"
                                title="Delete Table"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] text-muted font-mono opacity-40">
                      ({r}, {c})
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
