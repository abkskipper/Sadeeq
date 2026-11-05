import React, { useState } from 'react';
import { TradeSignal } from '../types';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
  Target,
  Shield,
  Zap,
  Flame,
  SearchCode,
} from 'lucide-react';

interface RawEvidencePanelProps {
  signal: TradeSignal;
  onInspectTimeframe?: (tf: 'HTF' | 'MTF' | 'LTF') => void;
}

export const RawEvidencePanel: React.FC<RawEvidencePanelProps> = ({
  signal,
  onInspectTimeframe,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showRawJson, setShowRawJson] = useState(false);

  // Extract raw evidence from signal object
  const sigAny = signal as any;
  const htfRaw =
    sigAny.higherTimeframe4H ||
    sigAny.chartEvaluation?.higherTimeframe ||
    sigAny.multiTimeframe?.higherTimeframe ||
    {};
  const mtfRaw =
    sigAny.middleTimeframe1H ||
    sigAny.chartEvaluation?.middleTimeframe ||
    sigAny.multiTimeframe?.middleTimeframe ||
    {};
  const ltfRaw =
    sigAny.lowerTimeframe15M ||
    sigAny.chartEvaluation?.lowerTimeframe ||
    sigAny.multiTimeframe?.lowerTimeframe ||
    {};

  // Helper to ensure evidence values are safely formatted strings
  const toCleanString = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      return val.evidence || val.description || val.type || val.status || JSON.stringify(val);
    }
    return String(val);
  };

  // Determine evidence presence for 5 key institutional pillars
  const liquiditySweepEvidence = toCleanString(
    ltfRaw.liquiditySweep ||
    mtfRaw.liquidity ||
    signal.aplusSmc?.liquiditySweep?.sweptLevel ||
    signal.aplusSmc?.liquiditySweep?.evidence ||
    signal.aplusSmc?.liquiditySweep?.sweepType ||
    signal.smcIct?.liquidity ||
    ''
  );
  const sweepStrLower = liquiditySweepEvidence.toLowerCase();
  const hasLiquiditySweep =
    Boolean(liquiditySweepEvidence) &&
    !sweepStrLower.includes('no fresh') &&
    !sweepStrLower.includes('none') &&
    !sweepStrLower.includes('not visible');

  const mssEvidence = toCleanString(
    ltfRaw.marketStructureShift ||
    ltfRaw.mssChoch ||
    signal.aplusSmc?.changeInStateOfDelivery?.shiftType ||
    signal.aplusSmc?.changeInStateOfDelivery?.evidence ||
    signal.smcIct?.choch ||
    signal.smcIct?.bos ||
    ''
  );
  const mssStrLower = mssEvidence.toLowerCase();
  const hasMss =
    Boolean(mssEvidence) &&
    !mssStrLower.includes('none') &&
    !mssStrLower.includes('not confirmed') &&
    !mssStrLower.includes('not visible');

  const displacementEvidence = toCleanString(
    ltfRaw.displacement ||
    ltfRaw.triggerType ||
    mtfRaw.displacement ||
    signal.aplusSmc?.changeInStateOfDelivery?.detailedSequence ||
    signal.explanation?.strongestSignals?.find((s: string) =>
      typeof s === 'string' && s.toLowerCase().includes('displacement')
    ) ||
    ''
  );
  const dispStrLower = displacementEvidence.toLowerCase();
  const hasDisplacement =
    Boolean(displacementEvidence) &&
    !dispStrLower.includes('none') &&
    !dispStrLower.includes('not visible');

  const fvgEvidence = toCleanString(
    ltfRaw.fvgStatus ||
    ltfRaw.fvgOb ||
    signal.aplusSmc?.poi?.type ||
    signal.smcIct?.fvg ||
    ''
  );
  const fvgStrLower = fvgEvidence.toLowerCase();
  const hasFvg =
    Boolean(fvgEvidence) &&
    !fvgStrLower.includes('none') &&
    !fvgStrLower.includes('not visible');

  const obEvidence = toCleanString(
    mtfRaw.poi ||
    mtfRaw.poiRefinement ||
    htfRaw.keyPoi ||
    signal.aplusSmc?.poi?.priceRange ||
    signal.smcIct?.orderBlocks ||
    ''
  );
  const obStrLower = obEvidence.toLowerCase();
  const hasOb =
    Boolean(obEvidence) &&
    !obStrLower.includes('none') &&
    !obStrLower.includes('not visible');

  const isConfirmed =
    signal.setupStatus === 'CONFIRMED' || signal.setupStatus === 'A+ CONFIRMED';
  const isDeveloping = signal.setupStatus === 'DEVELOPING';

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-[#080d1a] p-4 sm:p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-white font-mono uppercase tracking-wider">
                Raw Evidence Panel (4H · 1H · 15M)
              </h3>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold font-mono border ${
                  isConfirmed
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : isDeveloping
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {signal.setupStatus || 'EVALUATED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Multi-Timeframe Structure Inspection: 4H Macro Context → 1H Refinement → 15M Trigger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRawJson(!showRawJson)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950 text-[10px] font-mono text-slate-400 hover:text-slate-200 transition"
          >
            <SearchCode className="h-3 w-3 text-cyan-400" />
            {showRawJson ? 'Hide JSON' : 'Raw JSON'}
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950 text-[10px] font-mono text-slate-400 hover:text-slate-200 transition"
          >
            {isExpanded ? (
              <>
                <span>Collapse</span>
                <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                <span>Expand</span>
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Institutional 5-Pillar Evidence Checklist Bar */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-3">
            <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider block mb-2">
              Key Institutional Pillars Observed on Uploaded Charts:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { label: 'Liquidity Sweep', has: hasLiquiditySweep, desc: liquiditySweepEvidence },
                { label: 'MSS / Shift', has: hasMss, desc: mssEvidence },
                { label: 'Displacement', has: hasDisplacement, desc: displacementEvidence },
                { label: 'Fair Value Gap', has: hasFvg, desc: fvgEvidence },
                { label: 'Order Block / POI', has: hasOb, desc: obEvidence },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-2 text-xs font-mono transition ${
                    item.has
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900/50 border-slate-800/80 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {item.has ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className="text-[11px] font-bold truncate">{item.label}</span>
                  </div>
                  <span className="text-[9px] block text-slate-400 truncate">
                    {item.has ? 'Verified on chart' : 'Pending / Not Formed'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3 Timeframe Detailed Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* 4H Higher Timeframe Card */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/90 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      4H
                    </span>
                    <span className="text-xs font-bold text-white font-mono">Macro Context</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      (htfRaw.trend || signal.bias) === 'BULLISH'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : (htfRaw.trend || signal.bias) === 'BEARISH'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {htfRaw.trend || signal.bias || 'NEUTRAL'}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">
                      Market Structure:
                    </span>
                    <p className="text-slate-200 text-[11px] leading-relaxed mt-0.5">
                      {htfRaw.marketStructure || 'Major 4H structural order flow.'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">
                      Key POI / Zone:
                    </span>
                    <p className="text-emerald-400 font-semibold text-[11px] leading-relaxed mt-0.5">
                      {htfRaw.keyPoi || htfRaw.poi || 'Institutional POI / Supply & Demand.'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">
                      Draw on Liquidity:
                    </span>
                    <p className="text-cyan-300 text-[11px] leading-relaxed mt-0.5">
                      {htfRaw.drawOnLiquidity || 'Major external range liquidity pool.'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">
                      Equilibrium Status:
                    </span>
                    <p className="text-amber-300 text-[11px] leading-relaxed mt-0.5">
                      {htfRaw.equilibriumStatus || htfRaw.premiumDiscount || 'Discount / Premium Pricing.'}
                    </p>
                  </div>
                </div>
              </div>

              {onInspectTimeframe && (
                <button
                  type="button"
                  onClick={() => onInspectTimeframe('HTF')}
                  className="mt-3 w-full rounded-lg border border-slate-800 bg-slate-900/80 py-1.5 text-[10px] font-mono text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center justify-center gap-1"
                >
                  <Eye className="h-3 w-3 text-slate-400" />
                  Inspect 4H Chart
                </button>
              )}
            </div>

            {/* 1H Middle Timeframe Card */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/90 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      1H
                    </span>
                    <span className="text-xs font-bold text-white font-mono">Structural Shift</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      (mtfRaw.trend || signal.bias) === 'BULLISH'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : (mtfRaw.trend || signal.bias) === 'BEARISH'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {mtfRaw.trend || signal.bias || 'NEUTRAL'}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">
                      1H Structure & Alignment:
                    </span>
                    <p className="text-slate-200 text-[11px] leading-relaxed mt-0.5">
                      {mtfRaw.marketStructure || mtfRaw.structure || '1H internal structure refined.'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">
                      Refined POI / Breaker:
                    </span>
                    <p className="text-emerald-400 font-semibold text-[11px] leading-relaxed mt-0.5">
                      {mtfRaw.poiRefinement || mtfRaw.poi || 'Unmitigated FVG / Order Block.'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">
                      Inducement / Liquidity:
                    </span>
                    <p className="text-cyan-300 text-[11px] leading-relaxed mt-0.5">
                      {mtfRaw.inducement || mtfRaw.liquidity || 'Internal liquidity pools.'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">
                      Structural Invalidation:
                    </span>
                    <p className="text-rose-400 text-[11px] leading-relaxed mt-0.5">
                      {mtfRaw.invalidationLevel || signal.stopLoss || 'Swing extreme invalidation level.'}
                    </p>
                  </div>
                </div>
              </div>

              {onInspectTimeframe && (
                <button
                  type="button"
                  onClick={() => onInspectTimeframe('MTF')}
                  className="mt-3 w-full rounded-lg border border-slate-800 bg-slate-900/80 py-1.5 text-[10px] font-mono text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center justify-center gap-1"
                >
                  <Eye className="h-3 w-3 text-slate-400" />
                  Inspect 1H Chart
                </button>
              )}
            </div>

            {/* 15M Lower Timeframe Card */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/90 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      15M
                    </span>
                    <span className="text-xs font-bold text-white font-mono">Execution Trigger</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      ltfRaw.triggerConfirmed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {ltfRaw.triggerConfirmed ? 'TRIGGER CONFIRMED' : 'TRIGGER PENDING'}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">
                      Liquidity Sweep:
                    </span>
                    <p className="text-slate-200 text-[11px] leading-relaxed mt-0.5">
                      {ltfRaw.liquiditySweep || 'Evaluated from visible candles.'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">
                      MSS / Displacement:
                    </span>
                    <p className="text-cyan-300 text-[11px] leading-relaxed mt-0.5">
                      {ltfRaw.marketStructureShift || ltfRaw.displacement || 'Shift & displacement analysis.'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">
                      FVG / Retest Status:
                    </span>
                    <p className="text-emerald-400 text-[11px] leading-relaxed mt-0.5">
                      {ltfRaw.fvgStatus || ltfRaw.fvgOb || '15M Fair Value Gap mitigation zone.'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">
                      Execution Notes:
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed mt-0.5">
                      {ltfRaw.notes || '15M candle execution criteria.'}
                    </p>
                  </div>
                </div>
              </div>

              {onInspectTimeframe && (
                <button
                  type="button"
                  onClick={() => onInspectTimeframe('LTF')}
                  className="mt-3 w-full rounded-lg border border-slate-800 bg-slate-900/80 py-1.5 text-[10px] font-mono text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center justify-center gap-1"
                >
                  <Eye className="h-3 w-3 text-slate-400" />
                  Inspect 15M Chart
                </button>
              )}
            </div>
          </div>

          {/* Raw JSON Accordion for Full Auditability */}
          {showRawJson && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                  Raw Timeframe Evidence JSON Payload:
                </span>
                <span className="text-[10px] font-mono text-slate-500">Read-Only Diagnostic</span>
              </div>
              <pre className="max-h-60 overflow-auto rounded bg-slate-900/90 p-3 text-[10px] font-mono text-emerald-400 leading-relaxed">
                {JSON.stringify(
                  {
                    higherTimeframe4H: htfRaw,
                    middleTimeframe1H: mtfRaw,
                    lowerTimeframe15M: ltfRaw,
                    priceAxisScale: signal.priceAxisScale,
                    setupStatus: signal.setupStatus,
                    confidence: signal.confidence,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
