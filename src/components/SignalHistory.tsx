import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Bookmark,
  ExternalLink,
  Trash2,
  Eye,
} from 'lucide-react';
import { TradeSignal } from '../types';

interface SignalHistoryProps {
  signals: TradeSignal[];
  onSelectSignal: (signal: TradeSignal) => void;
  onUpdateOutcome: (signalId: string, outcome: 'WIN' | 'LOSS' | 'BREAKEVEN' | 'PENDING', realizedR?: number) => void;
  onSaveToWatchlist: (signal: TradeSignal) => void;
  isWatchlisted: (signalId: string) => boolean;
  onDeleteSignal: (signalId: string) => void;
}

export const SignalHistory: React.FC<SignalHistoryProps> = ({
  signals,
  onSelectSignal,
  onUpdateOutcome,
  onSaveToWatchlist,
  isWatchlisted,
  onDeleteSignal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [biasFilter, setBiasFilter] = useState<'ALL' | 'BULLISH' | 'BEARISH'>('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'WIN' | 'LOSS' | 'BREAKEVEN' | 'PENDING'>('ALL');

  // Filter signals
  const filtered = signals.filter(s => {
    const matchesSearch =
      s.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.strategy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.timeframe.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBias = biasFilter === 'ALL' || s.bias === biasFilter;
    const matchesOutcome =
      outcomeFilter === 'ALL' ||
      (outcomeFilter === 'PENDING' ? !s.outcome || s.outcome === 'PENDING' : s.outcome === outcomeFilter);

    return matchesSearch && matchesBias && matchesOutcome;
  });

  // Calculate Metrics
  const total = signals.length;
  const wins = signals.filter(s => s.outcome === 'WIN').length;
  const losses = signals.filter(s => s.outcome === 'LOSS').length;
  const closedCount = wins + losses;
  const winRate = closedCount > 0 ? Math.round((wins / closedCount) * 100) : 0;
  const avgConfidence = total > 0 ? Math.round(signals.reduce((acc, s) => acc + (s.confidence || 0), 0) / total) : 0;
  const totalR = signals.reduce((acc, s) => acc + (s.realizedR || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-blue-400" />
            <h1 className="text-2xl font-black text-white font-mono">SIGNAL HISTORY &amp; AUDIT</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Archived institutional signals, win rates, and post-trade performance analytics.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <span className="text-[11px] font-medium text-slate-400">Total Generated</span>
          <p className="mt-1 text-2xl font-bold text-white font-mono">{total}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <span className="text-[11px] font-medium text-slate-400">Win Rate</span>
          <p className="mt-1 text-2xl font-bold text-emerald-400 font-mono">
            {closedCount > 0 ? `${winRate}%` : 'N/A'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <span className="text-[11px] font-medium text-slate-400">Net Realized R</span>
          <p className={`mt-1 text-2xl font-bold font-mono ${totalR >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalR >= 0 ? `+${totalR.toFixed(1)}R` : `${totalR.toFixed(1)}R`}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <span className="text-[11px] font-medium text-slate-400">Avg Confidence</span>
          <p className="mt-1 text-2xl font-bold text-cyan-400 font-mono">{avgConfidence}%</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 mb-6">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search pair, timeframe, or strategy..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Bias Filter */}
          <select
            value={biasFilter}
            onChange={e => setBiasFilter(e.target.value as any)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300"
          >
            <option value="ALL">All Biases</option>
            <option value="BULLISH">Bullish</option>
            <option value="BEARISH">Bearish</option>
          </select>

          {/* Outcome Filter */}
          <select
            value={outcomeFilter}
            onChange={e => setOutcomeFilter(e.target.value as any)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300"
          >
            <option value="ALL">All Outcomes</option>
            <option value="WIN">Win</option>
            <option value="LOSS">Loss</option>
            <option value="BREAKEVEN">Break-even</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Table List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400 font-mono">
              <tr>
                <th className="py-3 px-4">Asset / Timeframe</th>
                <th className="py-3 px-4">Engine</th>
                <th className="py-3 px-4">Bias / Conf</th>
                <th className="py-3 px-4">Entry / SL / TP</th>
                <th className="py-3 px-4">Risk:Reward</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-sans text-xs">
                    No signals found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    {/* Asset & TF */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{s.asset}</div>
                      <span className="text-[10px] text-slate-400">{s.timeframe} · {new Date(s.created_at).toLocaleDateString()}</span>
                    </td>

                    {/* Engine */}
                    <td className="py-3.5 px-4">
                      <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-semibold">
                        {s.strategy}
                      </span>
                    </td>

                    {/* Bias & Confidence */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            s.bias === 'BULLISH'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {s.bias}
                        </span>
                        <span className="text-[11px] text-slate-400">{s.confidence}%</span>
                      </div>
                    </td>

                    {/* Entry / SL / TP */}
                    <td className="py-3.5 px-4 text-[11px]">
                      <div><span className="text-slate-500">E:</span> <span className="text-slate-200">{s.entry}</span></div>
                      <div><span className="text-rose-500">SL:</span> <span className="text-rose-400">{s.stopLoss}</span></div>
                      <div><span className="text-emerald-500">TP:</span> <span className="text-emerald-400">{s.takeProfit}</span></div>
                    </td>

                    {/* RR */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-cyan-400">{s.riskReward}</span>
                      <span className="text-[10px] text-slate-500 block">Grade {s.setupBadge}</span>
                    </td>

                    {/* Outcome / Result Selector */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onUpdateOutcome(s.id, 'WIN', 3.0)}
                          title="Mark Win (+3R)"
                          className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                            s.outcome === 'WIN'
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400'
                          }`}
                        >
                          WIN
                        </button>
                        <button
                          onClick={() => onUpdateOutcome(s.id, 'LOSS', -1.0)}
                          title="Mark Loss (-1R)"
                          className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                            s.outcome === 'LOSS'
                              ? 'bg-rose-500 text-white border-rose-400'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-rose-500/50 hover:text-rose-400'
                          }`}
                        >
                          LOSS
                        </button>
                        <button
                          onClick={() => onUpdateOutcome(s.id, 'BREAKEVEN', 0)}
                          title="Mark Break-even (0R)"
                          className={`px-1.5 py-1 rounded text-[10px] font-bold border transition ${
                            s.outcome === 'BREAKEVEN'
                              ? 'bg-blue-500 text-slate-950 border-blue-400'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-blue-500/50 hover:text-blue-400'
                          }`}
                        >
                          BE
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectSignal(s)}
                          title="View In Terminal"
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onSaveToWatchlist(s)}
                          title={isWatchlisted(s.id) ? 'Saved' : 'Add to Watchlist'}
                          className={`p-1.5 rounded-lg border transition ${
                            isWatchlisted(s.id)
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-amber-300 hover:bg-slate-800'
                          }`}
                        >
                          <Bookmark className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteSignal(s.id)}
                          title="Delete from Log"
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
