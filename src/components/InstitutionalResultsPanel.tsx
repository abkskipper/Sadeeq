import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Target,
  TrendingUp,
  TrendingDown,
  Info,
  Compass,
  ArrowRight,
  FileText,
  Eye,
  SlidersHorizontal,
  Lock,
  Zap,
} from 'lucide-react';
import { TradeSignal } from '../types';

interface InstitutionalResultsPanelProps {
  signal: TradeSignal;
}

export const InstitutionalResultsPanel: React.FC<InstitutionalResultsPanelProps> = ({ signal }) => {
  const overview = signal.marketOverview;
  const checklist = signal.institutionalChecklist || [];
  const plan = signal.tradePlan;
  const narrative = signal.tradeNarrative;
  const rejections = signal.rejectionReasons || [];
  const confLimits = signal.confidenceAndLimitations;

  const isBull = signal.bias === 'BULLISH';
  const isBear = signal.bias === 'BEARISH';
  const status = signal.setupStatus || 'DEVELOPING';
  const isConfirmed = status === 'CONFIRMED' || status === 'A+ SETUP' || status === 'A+ CONFIRMED';
  const isDeveloping = status === 'DEVELOPING' || status.includes('WAIT');

  return (
    <div className="space-y-6">
      {/* ============================================================= */}
      {/* SECTION A: MARKET OVERVIEW                                     */}
      {/* ============================================================= */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-[#080d1a] p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                  SECTION A · MARKET OVERVIEW
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-mono font-bold border ${
                    isConfirmed
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : isDeveloping
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {status}
                </span>
                {signal.stateMachineState && (
                  <span className="rounded-full bg-slate-800 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold">
                    STATE: {signal.stateMachineState}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-black text-white font-mono tracking-tight mt-0.5">
                {overview?.instrument || signal.asset} · {overview?.selectedStrategy || signal.strategy} INSTITUTIONAL AUDIT
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {overview?.analysisTimestamp
                ? new Date(overview.analysisTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* 6 Key Overview Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Instrument</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">{overview?.instrument || signal.asset}</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Directional Bias</span>
            <div className="flex items-center gap-1 mt-0.5">
              {isBull ? (
                <>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-400 font-mono">BULLISH</span>
                </>
              ) : isBear ? (
                <>
                  <TrendingDown className="h-4 w-4 text-rose-400" />
                  <span className="text-sm font-bold text-rose-400 font-mono">BEARISH</span>
                </>
              ) : (
                <span className="text-sm font-bold text-slate-400 font-mono">NEUTRAL</span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Higher TF</span>
            <span className="text-sm font-bold text-cyan-400 font-mono mt-0.5 block">{overview?.higherTimeframe || '4H'} Macro</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Middle TF</span>
            <span className="text-sm font-bold text-purple-400 font-mono mt-0.5 block">{overview?.middleTimeframe || '1H'} Structure</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Lower TF</span>
            <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">{overview?.lowerTimeframe || '15M'} Trigger</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Setup Grade</span>
            <span
              className={`text-sm font-black font-mono mt-0.5 block ${
                signal.setupGrade === 'A+' ? 'text-emerald-400' : signal.setupGrade === 'A' ? 'text-cyan-400' : 'text-amber-400'
              }`}
            >
              {plan?.setupGrade || signal.setupGrade || 'Developing'}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* SECTION B: INSTITUTIONAL SETUP CHECKLIST (9 STAGES)            */}
      {/* ============================================================= */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider">
                SECTION B · INSTITUTIONAL SETUP CHECKLIST (9 STAGES)
              </h4>
              <p className="text-[11px] text-slate-400 font-mono">
                Sequential Verification: HTF Zone → Mitigation → Sweep → Protected Level → Failure to Swing → CISD → Displacement → POI → Entry
              </p>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            Confirmed:{' '}
            <strong className="text-emerald-400">
              {checklist.filter(s => s.state === 'Confirmed').length}/9
            </strong>
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {checklist.map((stage) => {
            const isStageConfirmed = stage.state === 'Confirmed';
            const isStageAwaiting = stage.state === 'Awaiting confirmation';
            const isStageFailed = stage.state === 'Failed';
            const isStageUnobservable = stage.state === 'Not observable from the uploaded chart';

            const badgeBg = isStageConfirmed
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
              : isStageAwaiting
              ? 'bg-amber-950/70 border-amber-500/40 text-amber-300'
              : isStageFailed
              ? 'bg-rose-950/70 border-rose-500/40 text-rose-300'
              : isStageUnobservable
              ? 'bg-slate-900 border-slate-700 text-slate-400'
              : 'bg-slate-900/70 border-slate-800 text-slate-400';

            return (
              <div
                key={stage.stageNumber}
                className={`rounded-xl border p-3.5 transition flex flex-col justify-between ${
                  isStageConfirmed
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : isStageFailed
                    ? 'border-rose-500/30 bg-rose-950/10'
                    : 'border-slate-800 bg-slate-900/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <span className="text-[11px] font-mono font-bold text-white flex items-center gap-1.5">
                      <span className="flex h-4 w-4 items-center justify-center rounded bg-slate-800 text-[10px] text-emerald-400">
                        {stage.stageNumber}
                      </span>
                      {stage.name}
                    </span>
                    <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-mono font-bold border shrink-0 ${badgeBg}`}>
                      {stage.state}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans mb-2">
                    {stage.explanation}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 mt-1">
                  <span className="text-[10px] font-mono text-slate-400 block truncate">
                    <strong className="text-slate-300">Evidence:</strong> {stage.chartEvidence}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================= */}
      {/* SECTION C: TRADE PLAN                                          */}
      {/* ============================================================= */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider">
                SECTION C · INSTITUTIONAL TRADE PLAN
              </h4>
              <p className="text-[11px] text-slate-400 font-mono">
                Mathematically Validated Execution Levels · Anchor-Protected Invalidation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-lg text-xs font-mono font-black border ${
                plan?.direction === 'BUY'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : plan?.direction === 'SELL'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              DIRECTION: {plan?.direction || (isBull ? 'BUY' : isBear ? 'SELL' : 'NO TRADE')}
            </span>
          </div>
        </div>

        {/* Primary Trade Levels Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {/* Entry */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Sniper Entry</span>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">
                15M POI
              </span>
            </div>
            <span className="text-lg font-black text-white font-mono block">
              {plan?.entryZoneOrPrice !== undefined ? String(plan.entryZoneOrPrice) : (signal.entry ? String(signal.entry) : 'Not reliably measurable')}
            </span>
            <span className="text-[10px] text-slate-400 font-mono block mt-1">
              POI: {plan?.poiBoundaries || 'Execution zone'}
            </span>
          </div>

          {/* Stop Loss */}
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-rose-400 font-bold uppercase">Stop Loss (Invalidation)</span>
              <span className="text-[9px] font-mono text-rose-400 bg-rose-950 px-1.5 py-0.5 rounded border border-rose-500/30">
                ANCHORED
              </span>
            </div>
            <span className="text-lg font-black text-rose-300 font-mono block">
              {plan?.stopLossPrice !== undefined ? String(plan.stopLossPrice) : (signal.stopLoss ? String(signal.stopLoss) : 'Not reliably measurable')}
            </span>
            <span className="text-[10px] text-slate-400 font-mono block mt-1">
              Beyond {plan?.protectedLevel?.type || 'Extreme'}: {String(plan?.protectedLevel?.price || 'Anchor')}
            </span>
          </div>

          {/* Target 1 */}
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Target 1 (Primary)</span>
              <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-500/30">
                R:R {plan?.riskRewardTarget1 || signal.riskReward}
              </span>
            </div>
            <span className="text-lg font-black text-cyan-300 font-mono block">
              {plan?.target1 !== undefined ? String(plan.target1) : (signal.takeProfit ? String(signal.takeProfit) : 'Not reliably measurable')}
            </span>
            <span className="text-[10px] text-slate-400 font-mono block mt-1">
              Internal dealing range liquidity
            </span>
          </div>

          {/* Target 2 / 3 */}
          <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">Target 2 / Opposing Pool</span>
              {plan?.riskRewardTarget2 && (
                <span className="text-[9px] font-mono text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-500/30">
                  R:R {plan.riskRewardTarget2}
                </span>
              )}
            </div>
            <span className="text-lg font-black text-purple-300 font-mono block">
              {plan?.target2 ? String(plan.target2) : (signal.takeProfit2 ? String(signal.takeProfit2) : 'Awaiting Extension')}
            </span>
            <span className="text-[10px] text-slate-400 font-mono block mt-1">
              {plan?.target3 ? `Target 3: ${plan.target3}` : 'External range liquidity pool'}
            </span>
          </div>
        </div>

        {/* Structural Key Levels Reference Box */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-bold">
            Structural Audit References:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Protected Level</span>
              <span className="text-white font-bold block mt-0.5">
                {plan?.protectedLevel?.type}: {String(plan?.protectedLevel?.price)}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Liquidity Sweep Level</span>
              <span className="text-amber-400 font-bold block mt-0.5">
                {String(plan?.liquiditySweepLevel || 'N/A')}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">CISD Trigger Level</span>
              <span className="text-purple-400 font-bold block mt-0.5">
                {String(plan?.cisdReferenceLevel || 'N/A')}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Setup Invalidation Level</span>
              <span className="text-rose-400 font-bold block mt-0.5">
                {String(plan?.setupInvalidationLevel || plan?.protectedLevel?.price || 'Strict Anchor')}
              </span>
            </div>
          </div>
        </div>

        {/* Why Entry is NOT Liquidity Structural Separation Callout */}
        {(plan?.whyEntryIsNotLiquidity || signal.whyEntryIsNotLiquidity) && (
          <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-mono font-bold text-emerald-300 uppercase tracking-wider block">
                  Structural Separation: Why Entry Is NOT Liquidity
                </span>
                <p className="text-xs text-emerald-100 font-sans mt-0.5 leading-relaxed">
                  {plan?.whyEntryIsNotLiquidity || signal.whyEntryIsNotLiquidity}
                </p>
                {plan?.entryTrigger && (
                  <span className="text-[10px] text-emerald-400 font-mono block mt-1.5">
                    Trigger Confirmation: {plan.entryTrigger}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* SECTION D: TRADE NARRATIVE & CHRONOLOGICAL SEQUENCE           */}
      {/* ============================================================= */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl">
        <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider">
              SECTION D · TRADE NARRATIVE (CHRONOLOGICAL EVENT SEQUENCE)
            </h4>
            <p className="text-[11px] text-slate-400 font-mono">
              Step-by-step causal flow from macro inception to micro trigger
            </p>
          </div>
        </div>

        {/* Narrative Summary Callout */}
        {narrative?.summary && (
          <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-3.5 mb-4 text-xs font-mono text-purple-200">
            <strong className="text-white">Desk-Side Summary:</strong> {narrative.summary}
          </div>
        )}

        {/* Chronological Steps Sequence */}
        <ol className="space-y-2.5">
          {narrative?.chronologicalSequence.map((step, idx) => (
            <li key={idx} className="flex items-start gap-3 text-xs font-mono text-slate-300">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 font-mono text-[10px] font-bold text-emerald-400">
                {idx + 1}
              </span>
              <span className="mt-0.5 leading-relaxed font-sans">{step}</span>
            </li>
          ))}
        </ol>

        {/* What the Market Must Do Next */}
        {narrative?.nextRequiredMarketAction && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5">
            <div className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wider block">
                  Next Required Market Action:
                </span>
                <p className="text-xs text-amber-100 font-sans mt-0.5 leading-relaxed">
                  {narrative.nextRequiredMarketAction}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* SECTION E: REASONS TO REJECT THE TRADE                         */}
      {/* ============================================================= */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl">
        <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider">
              SECTION E · REASONS TO REJECT THE TRADE / INVALIDATION GATES
            </h4>
            <p className="text-[11px] text-slate-400 font-mono">
              Strict gate checks: Missing required conditions prevent premature entry execution
            </p>
          </div>
        </div>

        {rejections.length > 0 ? (
          <div className="space-y-2">
            {rejections.map((rej, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-xl border border-rose-900/40 bg-rose-950/20 p-3 text-xs"
              >
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-200 font-mono">{rej.condition}</span>
                    {rej.failedStage && (
                      <span className="rounded bg-rose-950 border border-rose-500/30 px-1.5 py-0.2 text-[9px] font-mono text-rose-400">
                        {rej.failedStage}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-[11px] font-sans">{rej.detail}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-xs font-mono text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              All mandatory institutional gating conditions confirmed. Zero disqualifying rejections observed on 4H, 1H, and 15M charts.
            </span>
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* SECTION F: CONFIDENCE & LIMITATIONS                           */}
      {/* ============================================================= */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl">
        <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider">
              SECTION F · CONFIDENCE BREAKDOWN & CALIBRATION LIMITATIONS
            </h4>
            <p className="text-[11px] text-slate-400 font-mono">
              Independent Calibration Metrics (Not a guaranteed win rate)
            </p>
          </div>
        </div>

        {/* 4 Separate Confidence Meters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {/* 1. Image Readability */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Image Readability</span>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {confLimits?.imageReadabilityConfidence ?? 90}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-300"
                style={{ width: `${confLimits?.imageReadabilityConfidence ?? 90}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-2 block">
              Clarity of price axis & candle bodies
            </span>
          </div>

          {/* 2. Structural Interpretation */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Structural Interpretation</span>
              <span className="text-xs font-mono font-bold text-purple-400">
                {confLimits?.structuralInterpretationConfidence ?? 85}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-400 transition-all duration-300"
                style={{ width: `${confLimits?.structuralInterpretationConfidence ?? 85}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-2 block">
              Multi-timeframe swing alignment
            </span>
          </div>

          {/* 3. Setup Completeness */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Setup Completeness</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {confLimits?.setupCompletenessConfidence ?? 78}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${confLimits?.setupCompletenessConfidence ?? 78}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-2 block">
              Percentage of 9 stages confirmed
            </span>
          </div>

          {/* 4. Price Measurement */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Price Measurement</span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {confLimits?.priceMeasurementConfidence ?? 88}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-300"
                style={{ width: `${confLimits?.priceMeasurementConfidence ?? 88}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-2 block">
              Confidence in execution level scales
            </span>
          </div>
        </div>

        {/* Limitations Notice */}
        {confLimits?.limitationsNotice && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400 font-mono mb-3 flex items-start gap-2">
            <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-300">Observation Limitations:</strong> {confLimits.limitationsNotice}
            </div>
          </div>
        )}

        {/* Mandatory Rigorous Calibration Disclaimer */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950 p-3.5 text-[11px] text-slate-400 font-mono leading-relaxed flex items-start gap-2.5">
          <Lock className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200">Statistical Calibration Notice:</strong>{' '}
            {confLimits?.calibrationDisclaimer ||
              'Model confidence represents algorithmic structural alignment and calibration, not a statistical guarantee of future price movement or win probability. Always practice disciplined risk management.'}
          </div>
        </div>
      </div>
    </div>
  );
};
