import React, { useState } from 'react';
import {
  Bookmark,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Trash2,
  Edit3,
  Check,
  AlertCircle,
} from 'lucide-react';
import { WatchlistItem, TradeSignal } from '../types';

interface WatchlistProps {
  items: WatchlistItem[];
  onOpenSignalInTerminal: (signal: TradeSignal) => void;
  onRemoveItem: (id: string) => void;
  onUpdateStatus: (id: string, status: 'ACTIVE' | 'TRIGGERED' | 'INVALIDATED' | 'CLOSED') => void;
  onUpdateNotes: (id: string, notes: string) => void;
}

export const Watchlist: React.FC<WatchlistProps> = ({
  items,
  onOpenSignalInTerminal,
  onRemoveItem,
  onUpdateStatus,
  onUpdateNotes,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  const handleStartEdit = (item: WatchlistItem) => {
    setEditingId(item.id);
    setTempNotes(item.notes || '');
  };

  const handleSaveNotes = (id: string) => {
    onUpdateNotes(id, tempNotes);
    setEditingId(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="h-6 w-6 text-amber-400" />
            <h1 className="text-2xl font-black text-white font-mono">ACTIVE DESK WATCHLIST</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Institutional high-probability setups under active monitoring.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
          <Bookmark className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Watchlist is currently empty</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Run an institutional chart analysis in the Terminal and click &quot;Save to Watchlist&quot; to track
            setups here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map(item => {
            const sig = item.signal;
            const isBullish = sig.bias === 'BULLISH';

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Asset, Timeframe, Status */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-mono font-bold ${
                          isBullish
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {isBullish ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        {sig.asset}
                      </div>
                      <span className="text-xs font-mono text-slate-400">{sig.timeframe}</span>
                    </div>

                    {/* Status badge / selector */}
                    <select
                      value={item.status}
                      onChange={e => onUpdateStatus(item.id, e.target.value as any)}
                      className={`text-[10px] font-mono font-bold rounded px-2 py-1 border ${
                        item.status === 'ACTIVE'
                          ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                          : item.status === 'TRIGGERED'
                          ? 'bg-blue-950/50 border-blue-500/40 text-blue-300'
                          : item.status === 'INVALIDATED'
                          ? 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                          : 'bg-slate-950 border-slate-700 text-slate-400'
                      }`}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="TRIGGERED">TRIGGERED</option>
                      <option value="INVALIDATED">INVALIDATED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>

                  {/* Level Metrics */}
                  <div className="grid grid-cols-3 gap-2 my-3 font-mono text-xs">
                    <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">ENTRY</span>
                      <span className="font-bold text-white">{sig.entry}</span>
                    </div>
                    <div className="rounded-lg bg-slate-950 p-2 border border-rose-950/40">
                      <span className="text-[10px] text-rose-400 block">SL</span>
                      <span className="font-bold text-rose-400">{sig.stopLoss}</span>
                    </div>
                    <div className="rounded-lg bg-slate-950 p-2 border border-emerald-950/40">
                      <span className="text-[10px] text-emerald-400 block">TP1</span>
                      <span className="font-bold text-emerald-400">{sig.takeProfit}</span>
                    </div>
                  </div>

                  {/* Notes Area */}
                  <div className="rounded-xl bg-slate-950/60 p-2.5 border border-slate-800/80 mb-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-semibold">Desk Notes</span>
                      {editingId === item.id ? (
                        <button
                          onClick={() => handleSaveNotes(item.id)}
                          className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[10px]"
                        >
                          <Check className="h-3 w-3" /> Save
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="text-slate-400 hover:text-white"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={tempNotes}
                        onChange={e => setTempNotes(e.target.value)}
                        placeholder="Add desk note..."
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none"
                      />
                    ) : (
                      <p className="text-xs text-slate-300 italic">
                        {item.notes || 'No desk notes added.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                  <span className="text-[10px] font-mono text-slate-500">
                    Engine: {sig.strategy} · R:R {sig.riskReward}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenSignalInTerminal(sig)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20"
                    >
                      <Eye className="h-3 w-3" /> Open Terminal
                    </button>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
