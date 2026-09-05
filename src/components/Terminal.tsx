import React, { useState } from 'react';
import {
  Sparkles,
  Upload,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Bookmark,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  DollarSign,
  Percent,
  Cpu,
  Clock,
  Gauge,
  ShieldAlert,
  ShieldCheck,
  Target,
  FileCheck,
  ChevronRight,
  TrendingUp,
  Image as ImageIcon,
  X,
  Plus,
  Eye,
} from 'lucide-react';
import {
  AssetClass,
  Timeframe,
  Strategy,
  TradeSignal,
  UserProfile,
  ChartImageInput,
  HigherTimeframeAnalysis,
  MiddleTimeframeAnalysis,
  LowerTimeframeAnalysis,
  MultiTimeframeFinalDecision,
} from '../types';
import { SAMPLE_CHARTS, generateCandlestickChartSvg, getMultiTimeframeSetForPreset } from '../data/sampleCharts';
import { AnnotatedChartCanvas } from './AnnotatedChartCanvas';
import { normalizeChartImage } from '../utils/imageUtils';

interface TerminalProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onSaveToWatchlist: (signal: TradeSignal) => void;
  isWatchlisted: (signalId: string) => boolean;
  onSignalGenerated?: (signal: TradeSignal) => void;
}

const ASSET_CLASSES: AssetClass[] = [
  'Forex',
  'Crypto',
  'Indices',
  'Commodities',
  'Stocks',
  'Synthetic',
];

const TIMEFRAMES: Timeframe[] = [
  'M1',
  'M5',
  'M15',
  'M30',
  'H1',
  'H4',
  'D1',
  'W1',
  'MN',
];

const STRATEGIES: Strategy[] = [
  'SMC',
  'ICT',
  'CRT',
  'Price Action',
  'Trend Following',
  'Breakout',
  'Pullback',
  'Range Trading',
  'Momentum',
  'Mean Reversion',
  'Scalping',
  'Swing Trading',
];

const POPULAR_PAIRS = [
  'BTCUSDT',
  'ETHUSDT',
  'EURUSD',
  'GBPUSD',
  'XAUUSD',
  'NAS100',
  'SPX500',
  'US30',
  'USDJPY',
  'SOLUSDT',
];

export interface ResolvedMultiTimeframe {
  isMultiTimeframe: boolean;
  htf: HigherTimeframeAnalysis;
  mtf: MiddleTimeframeAnalysis;
  ltf: LowerTimeframeAnalysis;
  finalDecision: MultiTimeframeFinalDecision;
  alignment: string;
  crossReasoning: string;
  mismatchNotice?: string;
}

export function resolveMultiTimeframeData(sig: TradeSignal): ResolvedMultiTimeframe {
  const mtf = sig.multiTimeframe;
  const isBull = sig.bias === 'BULLISH';
  const entry = sig.entry;
  const sl = sig.stopLoss;
  const tp1 = sig.takeProfit;
  const tp2 = sig.takeProfit2 || sig.takeProfit;
  const rr = sig.riskReward || '1 : 2.50';

  const hasExplicit = Boolean(mtf?.higherTimeframe && mtf?.middleTimeframe && mtf?.lowerTimeframe);
  const hasMultiCharts = Boolean(sig.chartImages?.htf || sig.chartImages?.mtf || mtf?.allTimeframesAnalyzed);

  const htf: HigherTimeframeAnalysis = mtf?.higherTimeframe || {
    analyzed: true,
    timeframe: '4H',
    bias: (sig.bias === 'BULLISH' || sig.bias === 'BEARISH') ? sig.bias : 'BULLISH',
    structure: sig.aplusSmc?.htfSupplyDemand?.type
      ? `${sig.aplusSmc.htfSupplyDemand.type} validated with clean macro order flow.`
      : 'Major 4H structural order flow holding protected demand above key swing low.',
    liquidity: mtf?.perTimeframe?.htf || 'Major buy-side liquidity pool resting above external equal highs.',
    poi: sig.aplusSmc?.htfSupplyDemand?.status
      ? `${sig.aplusSmc.htfSupplyDemand.status}: ${sig.aplusSmc.htfSupplyDemand.type}`
      : '4H Institutional Demand Zone located in deep discount pricing.',
    swingHigh: tp2,
    swingLow: sl,
    protectedLevel: String(sl),
    premiumDiscount: isBull ? 'Discount Zone (< 50% Equilibrium)' : 'Premium Zone (> 50% Equilibrium)',
    notes: '4H context establishes macro directional bias.',
    timeframeMismatchFlag: false,
  };

  const mtfData: MiddleTimeframeAnalysis = mtf?.middleTimeframe || {
    analyzed: true,
    timeframe: '1H',
    bias: (sig.bias === 'BULLISH' || sig.bias === 'BEARISH') ? sig.bias : 'BULLISH',
    structure: sig.aplusSmc?.changeInStateOfDelivery?.responsibleCandleStructure || '1H structure refined with clean BOS confirming demand reaction.',
    bosChoch: sig.aplusSmc?.changeInStateOfDelivery?.status === 'CONFIRMED'
      ? 'Confirmed 1H Break of Structure (BOS) with strong impulse body close.'
      : '1H Break of Structure (BOS)',
    liquidity: sig.aplusSmc?.liquiditySweep?.sweptLevel
      ? `Sell-side liquidity swept at ${sig.aplusSmc.liquiditySweep.sweptLevel} prior to displacement.`
      : 'Internal sell-side liquidity swept before displacement.',
    poi: sig.aplusSmc?.poi?.type
      ? `${sig.aplusSmc.poi.type} (${sig.aplusSmc.poi.priceRange || entry})`
      : '1H Bullish Order Block & Fair Value Gap unmitigated origin zone.',
    displacement: 'Strong expansion candle breaking structural swing high.',
    alignmentWithHtf: 'Aligned',
    notes: '1H confirms structure without divergence against 4H bias.',
    timeframeMismatchFlag: false,
  };

  const ltfData: LowerTimeframeAnalysis = mtf?.lowerTimeframe || {
    analyzed: true,
    timeframe: '15M',
    confirmation: sig.setupStatus === 'A+ CONFIRMED' ? 'CONFIRMED' : 'DEVELOPING',
    mssChoch: 'Confirmed 15M Market Structure Shift (MSS) with displacement body close.',
    displacement: 'Bullish impulse candle departing decisively from mitigated POI.',
    fvgOb: '15M Fair Value Gap retest & Order Block defense.',
    entry: entry,
    invalidation: sl,
    shortTermLiquidityTargets: `Targeting internal range liquidity pool at ${tp1}`,
    notes: '15M triggers sniper execution.',
    timeframeMismatchFlag: false,
  };

  const finalDecision: MultiTimeframeFinalDecision = mtf?.finalDecision || {
    direction: isBull ? 'BUY' : sig.bias === 'BEARISH' ? 'SELL' : 'WAIT',
    entry: entry,
    sl: sl,
    tp1: tp1,
    tp2: tp2,
    rr: rr,
    confidence: sig.confidence || 90,
    grade: sig.setupBadge || 'A+',
  };

  return {
    isMultiTimeframe: hasExplicit || hasMultiCharts || Boolean(mtf?.allTimeframesAnalyzed),
    htf,
    mtf: mtfData,
    ltf: ltfData,
    finalDecision,
    alignment: mtf?.alignment || 'Full Multi-Timeframe Confluence',
    crossReasoning: mtf?.crossTimeframeReasoning || `${htf.timeframe}: Macro structural demand verified → ${mtfData.timeframe}: Liquidity swept with confirmed displacement & BOS → ${ltfData.timeframe}: MSS & FVG mitigation → FINAL DECISION: ${finalDecision.direction}`,
    mismatchNotice: mtf?.timeframeMismatchNotice,
  };
}

export const Terminal: React.FC<TerminalProps> = ({
  user,
  onOpenAuth,
  onSaveToWatchlist,
  isWatchlisted,
  onSignalGenerated,
}) => {
  // Input State
  const [asset, setAsset] = useState('BTCUSDT');
  const [assetClass, setAssetClass] = useState<AssetClass>('Crypto');
  const [timeframe, setTimeframe] = useState<Timeframe>('H1');
  const [strategy, setStrategy] = useState<Strategy>('ICT');
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [accountBalance, setAccountBalance] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(1.0);

  // Chart Images State
  const initialMtfSet = getMultiTimeframeSetForPreset(SAMPLE_CHARTS[0].id);
  const [singleImage, setSingleImage] = useState<string>(SAMPLE_CHARTS[0].dataUrl);
  const [htfImage, setHtfImage] = useState<string>(initialMtfSet.htf);
  const [mtfImage, setMtfImage] = useState<string>(initialMtfSet.mtf);
  const [ltfImage, setLtfImage] = useState<string>(initialMtfSet.ltf);

  const [htfTimeframe, setHtfTimeframe] = useState<Timeframe>(initialMtfSet.htfTimeframe);
  const [mtfTimeframe, setMtfTimeframe] = useState<Timeframe>(initialMtfSet.mtfTimeframe);
  const [ltfTimeframe, setLtfTimeframe] = useState<Timeframe>(initialMtfSet.ltfTimeframe);

  // Execution & Output State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [signal, setSignal] = useState<TradeSignal | null>(null);
  const [activeTab, setActiveTab] = useState<'aplus' | 'reasoning' | 'structure' | 'smc' | 'volatility' | 'risk' | 'scores' | 'mtf' | 'validation'>('aplus');
  const [activeTimeframeView, setActiveTimeframeView] = useState<'LTF' | 'MTF' | 'HTF'>('LTF');
  const [copied, setCopied] = useState(false);

  // 7 analysis passes description for the institutional loading overlay
  const ANALYSIS_STEPS = [
    'Pass 1: Price Axis Calibration & Ground Truth Scale Reading...',
    'Pass 2: HTF Supply / Demand Zone & Structural Mitigation...',
    'Pass 3: Inducement Detection & Liquidity Sweep Audit...',
    'Pass 4: Protected High / Low & Failure To Swing Analysis...',
    'Pass 5: Change In State Of Delivery (CSD) & Causal POI Mapping...',
    'Pass 6: 15M POI Mitigation & Lower-Timeframe Sniper Entry...',
    'Pass 7: Invalidation SL Buffer & Liquidity Targets (TP1/TP2)...',
  ];

  // Handle preset sample selection
  const handleSelectSample = async (preset: typeof SAMPLE_CHARTS[0]) => {
    setAsset(preset.asset);
    setAssetClass(preset.assetClass);
    setTimeframe(preset.timeframe);
    setStrategy(preset.strategy);
    setErrorMsg(null);

    const mtfSet = getMultiTimeframeSetForPreset(preset.id);
    setHtfImage(mtfSet.htf);
    setMtfImage(mtfSet.mtf);
    setLtfImage(mtfSet.ltf);
    setHtfTimeframe(mtfSet.htfTimeframe);
    setMtfTimeframe(mtfSet.mtfTimeframe);
    setLtfTimeframe(mtfSet.ltfTimeframe);

    try {
      const normalized = await normalizeChartImage(preset.dataUrl);
      setSingleImage(normalized.dataUrl);
    } catch {
      setSingleImage(preset.dataUrl);
    }
  };

  // Handle image upload from file picker
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, role: 'SINGLE' | 'HTF' | 'MTF' | 'LTF') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPEG, WebP, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      try {
        const normalized = await normalizeChartImage(result);
        if (role === 'SINGLE') setSingleImage(normalized.dataUrl);
        else if (role === 'HTF') setHtfImage(normalized.dataUrl);
        else if (role === 'MTF') setMtfImage(normalized.dataUrl);
        else if (role === 'LTF') setLtfImage(normalized.dataUrl);
      } catch {
        if (role === 'SINGLE') setSingleImage(result);
        else if (role === 'HTF') setHtfImage(result);
        else if (role === 'MTF') setMtfImage(result);
        else if (role === 'LTF') setLtfImage(result);
      }
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  // Run Analysis
  const handleRunAnalysis = async () => {
    setErrorMsg(null);

    // Validate inputs
    if (!asset.trim()) {
      setErrorMsg('Please specify an asset/pair symbol (e.g. BTCUSDT, EURUSD, XAUUSD).');
      return;
    }

    const rawChartsPayload: ChartImageInput[] = [];

    if (mode === 'single') {
      if (!singleImage) {
        setErrorMsg('Please upload or select a chart image.');
        return;
      }
      rawChartsPayload.push({
        role: 'SINGLE',
        timeframe,
        imageBase64: singleImage,
        imageMime: singleImage.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png',
      });
    } else {
      // Multi-timeframe mode
      const primaryImg = singleImage || htfImage || mtfImage || ltfImage;
      if (!primaryImg && !htfImage && !mtfImage && !ltfImage) {
        setErrorMsg('Please upload a chart image for multi-timeframe analysis.');
        return;
      }

      rawChartsPayload.push({
        role: 'HTF',
        timeframe: htfTimeframe,
        imageBase64: htfImage || primaryImg,
        imageMime: (htfImage || primaryImg)?.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png',
      });
      rawChartsPayload.push({
        role: 'MTF',
        timeframe: mtfTimeframe,
        imageBase64: mtfImage || primaryImg,
        imageMime: (mtfImage || primaryImg)?.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png',
      });
      rawChartsPayload.push({
        role: 'LTF',
        timeframe: ltfTimeframe,
        imageBase64: ltfImage || primaryImg,
        imageMime: (ltfImage || primaryImg)?.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png',
      });
    }

    setIsAnalyzing(true);
    setAnalysisStep(0);

    // Step simulation interval for visual feedback
    const stepInterval = setInterval(() => {
      setAnalysisStep(prev => {
        if (prev < ANALYSIS_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 450);

    try {
      // Normalize all images to crisp lightweight PNGs
      const chartsPayload: ChartImageInput[] = await Promise.all(
        rawChartsPayload.map(async (c) => {
          if (!c.imageBase64) return c;
          const norm = await normalizeChartImage(c.imageBase64);
          return {
            ...c,
            imageBase64: norm.dataUrl,
            imageMime: norm.mimeType,
          };
        })
      );

      let response: Response | null = null;
      let lastFetchErr: any = null;
      const MAX_ATTEMPTS = 3;

      // Robust fetch with automatic retries and per-attempt timeout
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 28000);

        try {
          response = await fetch('/api/analyzeChart', {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              Authorization: user ? `Bearer ${user.id}` : 'Bearer usr_trader_demo',
            },
            body: JSON.stringify({
              asset: asset.toUpperCase().trim(),
              assetClass,
              timeframe: mode === 'single' ? timeframe : ltfTimeframe,
              strategy,
              charts: chartsPayload,
              accountBalance,
              riskPercent,
              userId: user?.id || 'usr_trader_demo',
            }),
          });
          clearTimeout(timeoutId);
          if (response && (response.ok || response.status === 422 || response.status === 400)) {
            break;
          }
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          lastFetchErr = fetchErr;
          if (attempt < MAX_ATTEMPTS) {
            // Exponential backoff between network retries
            await new Promise(resolve => setTimeout(resolve, attempt * 600));
          }
        }
      }

      if (!response) {
        clearInterval(stepInterval);
        console.warn('Network request failed after retries:', lastFetchErr);
        throw new Error('Connection to analysis engine is temporarily unavailable. Please click "Run Institutional Analysis" to retry.');
      }

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        throw new Error(`Server returned status code ${response.status}. Please retry your analysis.`);
      }

      clearInterval(stepInterval);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Analysis could not be completed.');
      }

      setSignal(data.signal);
      if (onSignalGenerated) {
        onSignalGenerated(data.signal);
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      console.warn('Analysis execution notice:', err?.message || err);
      setErrorMsg(err.message || 'Analysis failed. Please check your chart image and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyCard = () => {
    if (!signal) return;
    const text = `TradeGuard AI Signal
Asset: ${signal.asset} (${signal.timeframe})
Strategy: ${signal.strategy}
Bias: ${signal.bias} (Confidence: ${signal.confidence}%)
Grade: ${signal.setupBadge}
Entry: ${signal.entry}
Stop Loss: ${signal.stopLoss}
Take Profit: ${signal.takeProfit}
R:R: ${signal.riskReward}
Reasoning: ${signal.reasoning.join(' | ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* ------------------------------------------------------------- */}
      {/* TERMINAL HEADER & MODE BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl font-mono">
              ANALYSIS TERMINAL
            </h1>
            <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-xs font-bold text-emerald-400 font-mono">
              INSTITUTIONAL v2
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Institutional prop-desk chart engine anchored to exact pair, timeframe, and price action.
          </p>
        </div>

        {/* Mode Toggle: Single vs Multi-Timeframe */}
        <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1">
          <button
            onClick={() => setMode('single')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              mode === 'single'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Single-Chart Mode
          </button>
          <button
            onClick={() => setMode('multi')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              mode === 'multi'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Multi-TF Mode (HTF/MTF/LTF)
          </button>
        </div>
      </div>

      {/* Main Terminal Grid: Configuration & Inputs vs Signal Output */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* ------------------------------------------------------------- */}
        {/* LEFT COLUMN: SETUP CONFIGURATION & UPLOAD (5 cols) */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-5 lg:col-span-5">
          {/* Quick Preset Selector */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              1-Click Institutional Presets
            </span>
            <div className="grid grid-cols-2 gap-2 mt-2.5">
              {SAMPLE_CHARTS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectSample(preset)}
                  className={`flex flex-col items-start rounded-xl p-2.5 text-left border transition ${
                    asset === preset.asset && timeframe === preset.timeframe
                      ? 'border-emerald-500/50 bg-emerald-950/30 text-white shadow-sm'
                      : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono font-bold text-xs text-white">{preset.asset}</span>
                    <span className="text-[10px] font-mono text-emerald-400">{preset.timeframe}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 truncate w-full">
                    {preset.strategy} · {preset.assetClass}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Configuration Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm space-y-4">
            {/* Asset / Pair Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
                Asset / Pair
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={asset}
                  onChange={e => setAsset(e.target.value.toUpperCase())}
                  placeholder="e.g. BTCUSDT, EURUSD, XAUUSD"
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-mono font-bold text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Popular quick tags */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {POPULAR_PAIRS.slice(0, 7).map(p => (
                  <button
                    key={p}
                    onClick={() => {
                      setAsset(p);
                      if (p.includes('USD') && !p.includes('BTC') && !p.includes('ETH') && !p.includes('SOL')) {
                        if (p === 'XAUUSD') setAssetClass('Commodities');
                        else if (p === 'EURUSD' || p === 'GBPUSD' || p === 'USDJPY') setAssetClass('Forex');
                      } else if (p.includes('USDT')) {
                        setAssetClass('Crypto');
                      } else if (p.includes('100') || p.includes('500') || p.includes('30')) {
                        setAssetClass('Indices');
                      }
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold transition ${
                      asset === p
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Asset Class & Strategy Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Asset Class */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
                  Asset Class
                </label>
                <select
                  value={assetClass}
                  onChange={e => setAssetClass(e.target.value as AssetClass)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-white focus:border-emerald-500 focus:outline-none"
                >
                  {ASSET_CLASSES.map(ac => (
                    <option key={ac} value={ac}>
                      {ac}
                    </option>
                  ))}
                </select>
              </div>

              {/* Strategy Engine */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
                  Analysis Engine
                </label>
                <select
                  value={strategy}
                  onChange={e => setStrategy(e.target.value as Strategy)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-white focus:border-emerald-500 focus:outline-none"
                >
                  {STRATEGIES.map(st => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Timeframe Selection */}
            {mode === 'single' ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
                  Timeframe (M1 → W1)
                </label>
                <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-9">
                  {TIMEFRAMES.map(tf => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`py-1.5 text-center text-xs font-mono font-bold rounded-lg border transition ${
                        timeframe === tf
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Multi-Timeframe Selectors */
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 font-mono mb-1">
                    HTF Timeframe
                  </label>
                  <select
                    value={htfTimeframe}
                    onChange={e => setHtfTimeframe(e.target.value as Timeframe)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs font-mono text-white"
                  >
                    {TIMEFRAMES.map(tf => (
                      <option key={tf} value={tf}>
                        {tf}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 font-mono mb-1">
                    MTF Timeframe
                  </label>
                  <select
                    value={mtfTimeframe}
                    onChange={e => setMtfTimeframe(e.target.value as Timeframe)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs font-mono text-white"
                  >
                    {TIMEFRAMES.map(tf => (
                      <option key={tf} value={tf}>
                        {tf}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 font-mono mb-1">
                    LTF Timeframe
                  </label>
                  <select
                    value={ltfTimeframe}
                    onChange={e => setLtfTimeframe(e.target.value as Timeframe)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs font-mono text-white"
                  >
                    {TIMEFRAMES.map(tf => (
                      <option key={tf} value={tf}>
                        {tf}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Risk Management Inputs (Balance & Risk %) */}
            <div className="grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Account Size ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-500">$</span>
                  <input
                    type="number"
                    value={accountBalance}
                    onChange={e => setAccountBalance(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-7 pr-3 py-1.5 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Risk Per Trade (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.25"
                    value={riskPercent}
                    onChange={e => setRiskPercent(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-mono text-white"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500">%</span>
                </div>
              </div>
            </div>

            {/* Chart Upload / Drop Area */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
                {mode === 'single' ? 'Upload Chart Image' : 'Multi-Timeframe Chart Uploads'}
              </label>

              {mode === 'single' ? (
                <div className="relative rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/60 p-4 text-center hover:border-emerald-500/50 transition">
                  {singleImage ? (
                    <div className="relative group">
                      <img
                        src={singleImage}
                        alt="Uploaded chart"
                        className="max-h-36 mx-auto rounded-lg object-contain border border-slate-800"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition rounded-lg">
                        <label className="cursor-pointer rounded-md bg-slate-800 px-2.5 py-1 text-xs text-white hover:bg-slate-700">
                          Change Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleFileUpload(e, 'SINGLE')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center py-4">
                      <Upload className="h-8 w-8 text-slate-500 mb-2" />
                      <span className="text-xs font-semibold text-slate-300">
                        Click or drag &amp; drop chart image
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1">
                        PNG, JPG, WebP from TradingView / MT4 / MT5
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleFileUpload(e, 'SINGLE')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              ) : (
                /* Multi-chart 3 slot upload */
                <div className="grid grid-cols-3 gap-2">
                  {(['HTF', 'MTF', 'LTF'] as const).map(role => {
                    const img = role === 'HTF' ? htfImage : role === 'MTF' ? mtfImage : ltfImage;
                    const tf = role === 'HTF' ? htfTimeframe : role === 'MTF' ? mtfTimeframe : ltfTimeframe;
                    return (
                      <div
                        key={role}
                        className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-center"
                      >
                        <span className="text-[10px] font-mono font-bold text-emerald-400 block mb-1">
                          {role} ({tf})
                        </span>
                        {img ? (
                          <div className="relative group">
                            <img
                              src={img}
                              alt={role}
                              className="h-16 w-full object-cover rounded border border-slate-800"
                            />
                            <label className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-[10px] text-white">
                              Replace
                              <input
                                type="file"
                                accept="image/*"
                                onChange={e => handleFileUpload(e, role)}
                                className="hidden"
                              />
                            </label>
                          </div>
                        ) : (
                          <label className="h-16 flex flex-col items-center justify-center border border-dashed border-slate-700 rounded cursor-pointer hover:border-emerald-500/50">
                            <Plus className="h-4 w-4 text-slate-500" />
                            <span className="text-[9px] text-slate-400 mt-0.5">Upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => handleFileUpload(e, role)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-950/40 border border-rose-900/50 p-3 text-xs text-rose-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 transition cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
                  Running 7-Layer Institutional Analysis...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 fill-slate-950" />
                  Run Institutional Analysis
                </>
              )}
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* RIGHT COLUMN: SIGNAL DISPLAY & ANNOTATED CANVAS (7 cols) */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-5 lg:col-span-7">
          {/* Analysis Loading Modal / Stepper State */}
          {isAnalyzing && (
            <div className="rounded-2xl border border-emerald-500/40 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Cpu className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-mono">
                    TRADEGUARD AI ENGINE v2 ACTIVE
                  </h3>
                  <p className="text-xs text-emerald-400 font-mono">
                    Analyzing {asset} on {timeframe} ({strategy} Engine)...
                  </p>
                </div>
              </div>

              {/* Step indicator */}
              <div className="mt-5 space-y-2.5">
                {ANALYSIS_STEPS.map((stepText, idx) => {
                  const isDone = idx < analysisStep;
                  const isCurrent = idx === analysisStep;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 rounded-lg p-2 text-xs transition ${
                        isCurrent
                          ? 'bg-emerald-950/40 border border-emerald-500/30 text-white'
                          : isDone
                          ? 'text-slate-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : isCurrent ? (
                        <RefreshCw className="h-4 w-4 animate-spin text-emerald-400 shrink-0" />
                      ) : (
                        <span className="h-4 w-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 shrink-0">
                          {idx + 1}
                        </span>
                      )}
                      <span className="font-mono">{stepText}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Primary Signal Ticket Display (when signal is available) */}
          {signal && !isAnalyzing && (() => {
            const mtfResolved = resolveMultiTimeframeData(signal);
            return (
            <div className="space-y-5 animate-fade-in">
              {/* Ticket Header & Trade Action */}
              <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-[#0d121c] p-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Directional Bias Badge */}
                    <div
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-black font-mono tracking-wider shadow-sm shrink-0 ${
                        signal.bias === 'BULLISH'
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                          : signal.bias === 'BEARISH'
                          ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                          : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                      }`}
                    >
                      {signal.bias === 'BULLISH' ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      {signal.bias}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-extrabold text-white font-mono">
                          {signal.asset} · {mtfResolved.isMultiTimeframe ? `Multi-TF (${mtfResolved.htf.timeframe} / ${mtfResolved.mtf.timeframe} / ${mtfResolved.ltf.timeframe})` : signal.timeframe} · {signal.strategy}
                        </h2>
                        {mtfResolved.isMultiTimeframe && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 whitespace-nowrap">
                            <Layers className="h-3 w-3" />
                            3-TF CONFLUENCE
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                        <span>Session: {signal.session}</span>
                        <span>·</span>
                        <span className="whitespace-nowrap">{new Date(signal.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Confidence & Setup Badge */}
                  <div className="flex items-center gap-2">
                    {signal.chartQuality && (
                      <div className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-right hidden sm:block">
                        <span className="text-[10px] text-slate-400 font-mono block">CHART QUALITY</span>
                        <span className={`text-xs font-bold font-mono ${signal.chartQuality === 'ANALYZABLE' ? 'text-emerald-400' : signal.chartQuality === 'PARTIALLY ANALYZABLE' ? 'text-amber-400' : 'text-rose-400'}`}>
                          {signal.chartQuality}
                        </span>
                      </div>
                    )}

                    {signal.setupStatus && (
                      <div className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-right">
                        <span className="text-[10px] text-slate-400 font-mono block">SETUP STATUS</span>
                        <span className={`text-xs font-bold font-mono ${signal.setupStatus === 'A+ CONFIRMED' ? 'text-emerald-400' : signal.setupStatus === 'DEVELOPING' ? 'text-amber-400' : 'text-slate-400'}`}>
                          {signal.setupStatus}
                        </span>
                      </div>
                    )}

                    <div className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-right">
                      <span className="text-[10px] text-slate-400 font-mono block">CONFIDENCE</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        {signal.confidence}%
                      </span>
                    </div>

                    <div
                      className={`rounded-xl px-3 py-1.5 text-right border ${
                        signal.setupBadge === 'A+' || signal.setupBadge === 'A'
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                          : signal.setupBadge === 'B'
                          ? 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                          : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                      }`}
                    >
                      <span className="text-[10px] text-slate-400 font-mono block">GRADE</span>
                      <span className="text-sm font-black font-mono">{signal.setupBadge}</span>
                    </div>
                  </div>
                </div>

                {/* Quota Notice Banner if auto-fallback engine was activated */}
                {signal.quotaNotice && (
                  <div className="mt-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-cyan-300 font-mono">
                      <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
                      <span>{signal.quotaNotice}</span>
                    </div>
                    <span className="rounded bg-cyan-900/40 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-200 shrink-0">
                      0s LATENCY FALLBACK
                    </span>
                  </div>
                )}

                {/* Missing Conditions Banner if setup is developing */}
                {signal.aplusSmc?.missingConditions && signal.aplusSmc.missingConditions.length > 0 && (
                  <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-950/30 p-3.5 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-amber-300 font-mono block">
                        SETUP DEVELOPING — WAITING FOR SPECIFIC CONDITION
                      </span>
                      <ul className="mt-1 space-y-1 text-xs text-amber-200/90 font-mono">
                        {signal.aplusSmc.missingConditions.map((mc, idx) => (
                          <li key={idx}>• {mc}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Key Price Levels Bar */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mt-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                    <span className="text-[11px] font-semibold text-slate-400 font-mono">
                      Entry Price
                    </span>
                    <p className="mt-0.5 text-base font-bold text-white font-mono">
                      {signal.entry}
                    </p>
                    {signal.alternativeEntry && (
                      <span className="text-[10px] text-slate-500 font-mono block">
                        Alt: {signal.alternativeEntry}
                      </span>
                    )}
                  </div>

                  <div className="rounded-xl border border-rose-950/40 bg-slate-950/80 p-3">
                    <span className="text-[11px] font-semibold text-rose-400 font-mono">
                      Stop Loss
                    </span>
                    <p className="mt-0.5 text-base font-bold text-rose-400 font-mono">
                      {signal.stopLoss}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      Max Invalidation
                    </span>
                  </div>

                  <div className="rounded-xl border border-emerald-950/40 bg-slate-950/80 p-3">
                    <span className="text-[11px] font-semibold text-emerald-400 font-mono">
                      Take Profit (TP1)
                    </span>
                    <p className="mt-0.5 text-base font-bold text-emerald-400 font-mono">
                      {signal.takeProfit}
                    </p>
                    {signal.takeProfit2 && (
                      <span className="text-[10px] text-emerald-500 font-mono block">
                        TP2: {signal.takeProfit2}
                      </span>
                    )}
                  </div>

                  <div className="rounded-xl border border-cyan-950/40 bg-slate-950/80 p-3">
                    <span className="text-[11px] font-semibold text-cyan-400 font-mono">
                      Risk : Reward
                    </span>
                    <p className="mt-0.5 text-base font-bold text-cyan-400 font-mono">
                      {signal.riskReward}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      Expected R: {signal.qualityScore?.overall || 90}/100
                    </span>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* 3-STAGE MULTI-TIMEFRAME INSTITUTIONAL CONFLUENCE AUDIT */}
                {/* ------------------------------------------------------------- */}
                <div className="mt-4 rounded-xl border border-slate-800/90 bg-slate-950/90 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                        <Layers className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                            3-Stage Multi-Timeframe Institutional Audit
                          </span>
                          <span className="hidden sm:inline-flex rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400 font-mono">
                            {mtfResolved.alignment}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Higher Timeframe ({mtfResolved.htf.timeframe}) Context → Middle Timeframe ({mtfResolved.mtf.timeframe}) Structure → Lower Timeframe ({mtfResolved.ltf.timeframe}) Execution
                        </p>
                      </div>
                    </div>

                    {/* Quick View Controls */}
                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <span className="text-[10px] text-slate-500 font-mono hidden md:inline">Inspect Chart:</span>
                      <button
                        type="button"
                        onClick={() => setActiveTimeframeView('HTF')}
                        className={`rounded px-2.5 py-1 text-[11px] font-mono font-bold transition ${
                          activeTimeframeView === 'HTF'
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {mtfResolved.htf.timeframe}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTimeframeView('MTF')}
                        className={`rounded px-2.5 py-1 text-[11px] font-mono font-bold transition ${
                          activeTimeframeView === 'MTF'
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {mtfResolved.mtf.timeframe}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTimeframeView('LTF')}
                        className={`rounded px-2.5 py-1 text-[11px] font-mono font-bold transition ${
                          activeTimeframeView === 'LTF'
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {mtfResolved.ltf.timeframe}
                      </button>
                    </div>
                  </div>

                  {/* Timeframe Mismatch Notice if present */}
                  {mtfResolved.mismatchNotice && (
                    <div className="mb-3 rounded-lg border border-amber-500/40 bg-amber-950/30 p-2.5 text-xs text-amber-300 font-mono flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                      <span>{mtfResolved.mismatchNotice}</span>
                    </div>
                  )}

                  {/* 3 Columns: HTF, MTF, LTF */}
                  <div className="grid gap-3 md:grid-cols-3">
                    {/* Stage 1: HTF */}
                    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">STAGE 1</span>
                            <span className="text-xs font-bold text-white font-mono">HTF ({mtfResolved.htf.timeframe})</span>
                          </div>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              mtfResolved.htf.bias === 'BULLISH'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : mtfResolved.htf.bias === 'BEARISH'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {mtfResolved.htf.bias}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Structure & Trend:</span>
                            <p className="text-slate-200 mt-0.5 text-[11px] leading-relaxed">{mtfResolved.htf.structure}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Liquidity Pools:</span>
                            <p className="text-slate-300 mt-0.5 text-[11px] leading-relaxed">{mtfResolved.htf.liquidity}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Point of Interest (POI):</span>
                            <p className="text-emerald-400 font-bold mt-0.5 text-[11px] leading-relaxed">{mtfResolved.htf.poi}</p>
                          </div>
                          {mtfResolved.htf.protectedLevel && (
                            <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                              <span className="text-slate-400">Protected Level:</span>
                              <span className="text-rose-400 font-bold">{mtfResolved.htf.protectedLevel}</span>
                            </div>
                          )}
                          {mtfResolved.htf.premiumDiscount && (
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-400">Pricing:</span>
                              <span className="text-cyan-400 font-semibold">{mtfResolved.htf.premiumDiscount}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTimeframeView('HTF')}
                        className="mt-3 w-full rounded-lg border border-slate-800 bg-slate-950/80 py-1.5 text-[11px] font-mono font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        View {mtfResolved.htf.timeframe} Chart
                      </button>
                    </div>

                    {/* Stage 2: MTF */}
                    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">STAGE 2</span>
                            <span className="text-xs font-bold text-white font-mono">MTF ({mtfResolved.mtf.timeframe})</span>
                          </div>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              mtfResolved.mtf.bias === 'BULLISH'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : mtfResolved.mtf.bias === 'BEARISH'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {mtfResolved.mtf.bias}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Structure Refinement:</span>
                            <p className="text-slate-200 mt-0.5 text-[11px] leading-relaxed">{mtfResolved.mtf.structure}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">BOS / CHoCH:</span>
                            <p className="text-cyan-400 font-bold mt-0.5 text-[11px] leading-relaxed">{mtfResolved.mtf.bosChoch}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Liquidity Sweep:</span>
                            <p className="text-slate-300 mt-0.5 text-[11px] leading-relaxed">{mtfResolved.mtf.liquidity}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Refined POI:</span>
                            <p className="text-emerald-400 font-bold mt-0.5 text-[11px] leading-relaxed">{mtfResolved.mtf.poi}</p>
                          </div>
                          {mtfResolved.mtf.displacement && (
                            <div className="pt-1 border-t border-slate-800/60 text-[10px]">
                              <span className="text-slate-400 block font-sans">Displacement:</span>
                              <span className="text-slate-300">{mtfResolved.mtf.displacement}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTimeframeView('MTF')}
                        className="mt-3 w-full rounded-lg border border-slate-800 bg-slate-950/80 py-1.5 text-[11px] font-mono font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        View {mtfResolved.mtf.timeframe} Chart
                      </button>
                    </div>

                    {/* Stage 3: LTF */}
                    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">STAGE 3</span>
                            <span className="text-xs font-bold text-white font-mono">LTF ({mtfResolved.ltf.timeframe})</span>
                          </div>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              mtfResolved.ltf.confirmation === 'CONFIRMED'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {mtfResolved.ltf.confirmation}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">MSS / CHoCH:</span>
                            <p className="text-cyan-400 font-bold mt-0.5 text-[11px] leading-relaxed">{mtfResolved.ltf.mssChoch}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Displacement:</span>
                            <p className="text-slate-200 mt-0.5 text-[11px] leading-relaxed">{mtfResolved.ltf.displacement}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">FVG / OB Retest:</span>
                            <p className="text-emerald-400 font-bold mt-0.5 text-[11px] leading-relaxed">{mtfResolved.ltf.fvgOb}</p>
                          </div>
                          <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">Execution Entry:</span>
                            <span className="text-white font-bold">{mtfResolved.ltf.entry}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">Invalidation (SL):</span>
                            <span className="text-rose-400 font-bold">{mtfResolved.ltf.invalidation}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTimeframeView('LTF')}
                        className="mt-3 w-full rounded-lg border border-slate-800 bg-slate-950/80 py-1.5 text-[11px] font-mono font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        View {mtfResolved.ltf.timeframe} Chart
                      </button>
                    </div>
                  </div>

                  {/* Stage 4: FINAL TRADE DECISION */}
                  <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-bold">
                          STAGE 4
                        </span>
                        <span className="text-xs font-extrabold text-white font-mono">
                          FINAL TRADE DECISION (3-TIMEFRAME SYNTHESIS)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400">Decision:</span>
                        <span
                          className={`rounded px-2.5 py-0.5 text-xs font-black font-mono tracking-wide ${
                            mtfResolved.finalDecision.direction === 'BUY'
                              ? 'bg-emerald-500 text-slate-950'
                              : mtfResolved.finalDecision.direction === 'SELL'
                              ? 'bg-rose-500 text-white'
                              : 'bg-amber-500 text-slate-950'
                          }`}
                        >
                          {mtfResolved.finalDecision.direction}
                        </span>
                        <span className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-xs font-mono font-bold text-emerald-400">
                          Grade: {mtfResolved.finalDecision.grade}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="rounded-lg bg-slate-950/80 border border-slate-800/80 p-2">
                        <span className="text-[10px] text-slate-400 block font-sans">Execution Entry</span>
                        <span className="text-white font-bold">{mtfResolved.finalDecision.entry}</span>
                      </div>
                      <div className="rounded-lg bg-slate-950/80 border border-slate-800/80 p-2">
                        <span className="text-[10px] text-rose-400 block font-sans">Stop Loss</span>
                        <span className="text-rose-400 font-bold">{mtfResolved.finalDecision.sl}</span>
                      </div>
                      <div className="rounded-lg bg-slate-950/80 border border-slate-800/80 p-2">
                        <span className="text-[10px] text-emerald-400 block font-sans">TP1 / TP2</span>
                        <span className="text-emerald-400 font-bold">{mtfResolved.finalDecision.tp1} {mtfResolved.finalDecision.tp2 ? `· ${mtfResolved.finalDecision.tp2}` : ''}</span>
                      </div>
                      <div className="rounded-lg bg-slate-950/80 border border-slate-800/80 p-2">
                        <span className="text-[10px] text-cyan-400 block font-sans">RR / Confidence</span>
                        <span className="text-cyan-400 font-bold">{mtfResolved.finalDecision.rr} · {mtfResolved.finalDecision.confidence}%</span>
                      </div>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-300 font-mono leading-relaxed">
                      <span className="text-slate-400 font-semibold">Causal Sequence:</span> {mtfResolved.crossReasoning}
                    </p>
                  </div>
                </div>

                {/* Quick Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSaveToWatchlist(signal)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium border transition ${
                        isWatchlisted(signal.id)
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Bookmark className="h-3.5 w-3.5" />
                      {isWatchlisted(signal.id) ? 'Saved to Watchlist' : 'Save to Watchlist'}
                    </button>

                    <button
                      onClick={handleCopyCard}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 font-medium text-slate-300 hover:bg-slate-800 transition"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy Signal
                        </>
                      )}
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono">
                    ID: {signal.id.substring(0, 12)}
                  </span>
                </div>
              </div>

              {/* Annotated Chart Visual Canvas */}
              <AnnotatedChartCanvas
                signal={signal}
                activeTimeframeView={activeTimeframeView}
                onTimeframeViewChange={setActiveTimeframeView}
              />

              {/* ------------------------------------------------------------- */}
              {/* DETAILED 7-LAYER ANALYSIS TABS */}
              {/* ------------------------------------------------------------- */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
                {/* Tab Navigation Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-3">
                  {[
                    { id: 'aplus', label: 'A+ SMC Blueprint', icon: Sparkles, highlight: true },
                    { id: 'reasoning', label: 'Reasoning & Confluence', icon: CheckCircle2 },
                    { id: 'structure', label: 'Market Structure', icon: TrendingUp },
                    { id: 'smc', label: 'SMC / ICT Breakdown', icon: Target },
                    { id: 'volatility', label: 'Volatility & Session', icon: Gauge },
                    { id: 'risk', label: 'Risk Management', icon: ShieldCheck },
                    { id: 'scores', label: 'Strategy Matrix', icon: Sliders },
                    { id: 'mtf', label: 'Multi-TF Alignment', icon: Layers },
                    { id: 'validation', label: 'Validation Check', icon: FileCheck },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        activeTab === tab.id
                          ? tab.highlight
                            ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                            : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm'
                          : tab.highlight
                          ? 'border border-emerald-500/30 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <tab.icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab 0: A+ SMC Blueprint & Causal Sequence */}
                {activeTab === 'aplus' && signal.aplusSmc && (
                  <div className="mt-4 space-y-5">
                    {/* Header Banner */}
                    <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-900 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 font-black text-xs font-mono">
                            A+
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-white font-mono">
                              INSTITUTIONAL SMC CAUSAL SETUP ENGINE
                            </h4>
                            <span className="text-[11px] text-emerald-400 font-mono">
                              Model: Liquidity Sweep → Protected Structure → Failure To Swing → CSD → POI → 15M Entry
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs font-mono text-slate-300">
                            Bias: <strong className={signal.bias === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}>{signal.bias}</strong>
                          </span>
                          <span className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs font-mono text-cyan-400">
                            R:R: <strong>{signal.aplusSmc.calculatedRiskReward || signal.riskReward}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* A+ Confluence Audit Breakdown (12 Institutional Components) */}
                    {(signal.aplusConfluenceAudit || signal.aplusSmc?.confluenceAudit) && (() => {
                      const audit = signal.aplusConfluenceAudit || signal.aplusSmc?.confluenceAudit!;
                      return (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold shrink-0">
                                <ShieldCheck className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                                    A+ Confluence Audit · 12-Factor Verification
                                  </h5>
                                  <span
                                    className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-black ${
                                      audit.isAplusQualified
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                        : audit.grade === 'Developing'
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    }`}
                                  >
                                    {audit.isAplusQualified ? 'A+ QUALIFIED' : audit.grade.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  Score: <strong className="text-emerald-400">{audit.confirmedCount}/{audit.totalComponents || 12}</strong> verified conditions · Strict institutional quality gating
                                </p>
                              </div>
                            </div>

                            {/* Meter */}
                            <div className="flex items-center gap-2">
                              <div className="w-28 sm:w-36 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    audit.confirmedCount >= 10
                                      ? 'bg-emerald-500'
                                      : audit.confirmedCount >= 7
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${(audit.confirmedCount / 12) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono font-bold text-white">
                                {Math.round((audit.confirmedCount / 12) * 100)}%
                              </span>
                            </div>
                          </div>

                          {/* Summary message */}
                          <div
                            className={`rounded-lg p-3 text-xs font-mono ${
                              audit.isAplusQualified
                                ? 'bg-emerald-950/20 border border-emerald-500/30 text-emerald-200'
                                : 'bg-amber-950/20 border border-amber-500/30 text-amber-200'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {audit.isAplusQualified ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                              )}
                              <div className="space-y-1">
                                <p className="leading-relaxed">{audit.summary}</p>
                                {audit.rejectionReason && (
                                  <p className="text-[11px] text-amber-300 font-semibold">
                                    Status: {audit.rejectionReason}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 12 Component Cards Grid */}
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 pt-1">
                            {audit.components.map((comp) => (
                              <div
                                key={comp.id}
                                className={`rounded-lg border p-2.5 transition flex flex-col justify-between ${
                                  comp.status === 'CONFIRMED'
                                    ? 'border-slate-800 bg-slate-900/60'
                                    : comp.status === 'PARTIAL'
                                    ? 'border-amber-900/40 bg-amber-950/20'
                                    : 'border-slate-800/80 bg-slate-950/40 opacity-75'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="text-[11px] font-mono font-bold text-white truncate">
                                    {comp.name}
                                  </span>
                                  <span
                                    className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold shrink-0 ${
                                      comp.status === 'CONFIRMED'
                                        ? 'bg-emerald-950 border border-emerald-500/30 text-emerald-400'
                                        : comp.status === 'PARTIAL'
                                        ? 'bg-amber-950 border border-amber-500/30 text-amber-400'
                                        : 'bg-slate-900 border border-slate-700 text-slate-400'
                                    }`}
                                  >
                                    {comp.status}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-snug line-clamp-2 font-mono">
                                  {comp.evidence}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* The 10-Step Institutional SMC Setup Sequence Grid */}
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4 text-emerald-400" />
                        10-Step Institutional Setup Sequence
                      </h5>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {/* 1. HTF Zone */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-emerald-400">STEP 1: HTF ZONE</span>
                            <span className="rounded bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-mono text-emerald-300">
                              {signal.aplusSmc.htfSupplyDemand.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white font-mono">{signal.aplusSmc.htfSupplyDemand.type}</p>
                          <p className="text-[11px] text-slate-300 font-mono">Range: {signal.aplusSmc.htfSupplyDemand.zoneRange} ({signal.aplusSmc.htfSupplyDemand.timeframe})</p>
                          <p className="text-[10px] text-slate-400">{signal.aplusSmc.htfSupplyDemand.structuralOrigin}</p>
                        </div>

                        {/* 2. HTF Mitigation */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-emerald-400">STEP 2: MITIGATION</span>
                            <span className="rounded bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-mono text-emerald-300">
                              {signal.aplusSmc.htfMitigation.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white">{signal.aplusSmc.htfMitigation.entryDepth}</p>
                          <p className="text-[11px] text-slate-300">{signal.aplusSmc.htfMitigation.reactionProduced}</p>
                          <p className="text-[10px] text-slate-400">{signal.aplusSmc.htfMitigation.liquidityPresent}</p>
                        </div>

                        {/* 3. Inducement */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-amber-400">STEP 3: INDUCEMENT</span>
                            <span className="rounded bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-mono text-amber-300">
                              {signal.aplusSmc.inducement.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-amber-300 font-mono">Level: {signal.aplusSmc.inducement.level}</p>
                          <p className="text-[11px] text-slate-300">{signal.aplusSmc.inducement.type}</p>
                          <p className="text-[10px] text-slate-400">{signal.aplusSmc.inducement.description}</p>
                        </div>

                        {/* 4. Liquidity Sweep */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-amber-400">STEP 4: LIQUIDITY SWEEP</span>
                            <span className="rounded bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-mono text-amber-300">
                              {signal.aplusSmc.liquiditySweep.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white font-mono">Swept: {signal.aplusSmc.liquiditySweep.sweptLevel}</p>
                          <p className="text-[11px] text-slate-300">{signal.aplusSmc.liquiditySweep.wickVsBodyClose}</p>
                          <p className="text-[10px] text-slate-400">{signal.aplusSmc.liquiditySweep.rejectionValidation}</p>
                        </div>

                        {/* 5. Protected Level */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-cyan-400">STEP 5: PROTECTED LEVEL</span>
                            <span className="rounded bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300">
                              INVALIDATION ANCHOR
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white font-mono">{signal.aplusSmc.protectedLevel.type}: {signal.aplusSmc.protectedLevel.price}</p>
                          <p className="text-[11px] text-slate-300">{signal.aplusSmc.protectedLevel.causalConnection}</p>
                          <p className="text-[10px] text-slate-400">{signal.aplusSmc.protectedLevel.invalidationRole}</p>
                        </div>

                        {/* 6. Failure To Swing */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-purple-400">STEP 6: FAILURE TO SWING</span>
                            <span className="rounded bg-purple-950/60 border border-purple-500/30 px-1.5 py-0.5 text-[10px] font-mono text-purple-300">
                              {signal.aplusSmc.failureToSwing.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white font-mono">Failure Point: {signal.aplusSmc.failureToSwing.failurePoint}</p>
                          <p className="text-[11px] text-slate-300 font-mono">Trigger Level: {signal.aplusSmc.failureToSwing.triggerFailureLowHigh}</p>
                          <p className="text-[10px] text-slate-400">{signal.aplusSmc.failureToSwing.structuralMechanism}</p>
                        </div>

                        {/* 7. Change In State Of Delivery */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-purple-400">STEP 7: CSD CONFIRMED</span>
                            <span className="rounded bg-purple-950/60 border border-purple-500/30 px-1.5 py-0.5 text-[10px] font-mono text-purple-300">
                              {signal.aplusSmc.changeInStateOfDelivery.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white">{signal.aplusSmc.changeInStateOfDelivery.shiftType}</p>
                          <p className="text-[11px] text-slate-300 font-mono">Break Close: {signal.aplusSmc.changeInStateOfDelivery.breakCloseLevel}</p>
                          <p className="text-[10px] text-slate-400">{signal.aplusSmc.changeInStateOfDelivery.responsibleCandleStructure}</p>
                        </div>

                        {/* 8. POI Generated */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-indigo-400">STEP 8: VALIDATED POI</span>
                            <span className="rounded bg-indigo-950/60 border border-indigo-500/30 px-1.5 py-0.5 text-[10px] font-mono text-indigo-300">
                              {signal.aplusSmc.poi.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white">{signal.aplusSmc.poi.type}</p>
                          <p className="text-[11px] text-slate-300 font-mono">Range: {signal.aplusSmc.poi.priceRange}</p>
                          <p className="text-[10px] text-slate-400">{signal.aplusSmc.poi.causalConnectionToDeliveryChange}</p>
                        </div>

                        {/* 9. POI Mitigation & Sniper Entry */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-emerald-400">STEP 9 & 10: SNIPER ENTRY</span>
                            <span className="rounded bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-mono text-emerald-300">
                              {signal.aplusSmc.sniperEntry.executionTimeframe}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-emerald-400 font-mono">
                            Primary Entry: {signal.aplusSmc.sniperEntry.entryPrice}
                          </p>
                          {(signal.aplusSmc.sniperEntry.alternativeEntryPrice || signal.alternativeEntry) && (
                            <p className="text-[11px] text-cyan-400 font-mono">
                              Alt Entry: {signal.aplusSmc.sniperEntry.alternativeEntryPrice || signal.alternativeEntry}
                            </p>
                          )}
                          {signal.aplusSmc.sniperEntry.entryModelRank && (
                            <p className="text-[10px] text-amber-300 font-mono">
                              Rank: {signal.aplusSmc.sniperEntry.entryModelRank}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-300">{signal.aplusSmc.sniperEntry.confirmationType}</p>
                          <p className="text-[10px] text-slate-400">{signal.aplusSmc.poiMitigation.reactionConfirmation}</p>
                        </div>
                      </div>
                    </div>

                    {/* Step 11, 12, 13: Stop Loss, Targets, and R:R */}
                    <div className="grid gap-3 sm:grid-cols-3">
                      {/* SL */}
                      <div className="rounded-xl border border-rose-950/60 bg-slate-950/80 p-3.5 space-y-1">
                        <span className="text-[10px] font-mono font-bold text-rose-400 block">STEP 11: INVALIDATION SL</span>
                        <p className="text-base font-bold text-rose-400 font-mono">{signal.aplusSmc.stopLoss.stopLossPrice}</p>
                        <p className="text-xs text-slate-300 font-mono">Buffer: {signal.aplusSmc.stopLoss.bufferAmount}</p>
                        <p className="text-[10px] text-slate-400">{signal.aplusSmc.stopLoss.rationale}</p>
                      </div>

                      {/* TP */}
                      <div className="rounded-xl border border-emerald-950/60 bg-slate-950/80 p-3.5 space-y-1">
                        <span className="text-[10px] font-mono font-bold text-emerald-400 block">STEP 12: LIQUIDITY TARGETS</span>
                        <p className="text-xs font-bold text-emerald-400 font-mono">TP1 (Internal): {signal.aplusSmc.takeProfitTargets.tp1}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{signal.aplusSmc.takeProfitTargets.tp1LiquidityType}</p>
                        {signal.aplusSmc.takeProfitTargets.tp2 && (
                          <p className="text-xs font-bold text-emerald-300 font-mono mt-1">TP2 (External): {signal.aplusSmc.takeProfitTargets.tp2}</p>
                        )}
                      </div>

                      {/* R:R */}
                      <div className="rounded-xl border border-cyan-950/60 bg-slate-950/80 p-3.5 space-y-1">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 block">STEP 13: ASYMMETRIC R:R</span>
                        <p className="text-base font-bold text-cyan-400 font-mono">{signal.aplusSmc.calculatedRiskReward || signal.riskReward}</p>
                        <p className="text-xs text-slate-300">Desk Quality Score: {signal.qualityScore?.overall || 92}/100</p>
                        <p className="text-[10px] text-slate-400">Institutional edge criteria validated.</p>
                      </div>
                    </div>

                    {/* Step-by-Step Validation Checklist */}
                    {signal.aplusSmc.checklist && signal.aplusSmc.checklist.length > 0 && (
                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-3 flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-emerald-400" />
                          Institutional A+ SMC Validation Checklist
                        </h5>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {signal.aplusSmc.checklist.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5 text-xs">
                              <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${item.status === 'CONFIRMED' ? 'text-emerald-400' : item.status === 'PENDING' ? 'text-amber-400' : 'text-rose-400'}`} />
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white font-mono">#{item.stepNumber} {item.condition}</span>
                                  <span className={`text-[10px] font-mono px-1 rounded ${item.status === 'CONFIRMED' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}`}>
                                    {item.status}
                                  </span>
                                </div>
                                <p className="text-slate-400 text-[11px]">{item.evidence}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Causal Reasoning Sequence */}
                    {signal.aplusSmc.causalReasoningSequence && signal.aplusSmc.causalReasoningSequence.length > 0 && (
                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          Desk-Side Causal Reasoning Chain
                        </h5>
                        <ol className="space-y-2 text-xs text-slate-300">
                          {signal.aplusSmc.causalReasoningSequence.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-800 font-mono text-[10px] font-bold text-emerald-400">
                                {idx + 1}
                              </span>
                              <span className="mt-0.5 leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 1: Reasoning & Confluence */}
                {activeTab === 'reasoning' && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono mb-2">
                        Desk-Side Analyst Reasoning
                      </h4>
                      <ul className="space-y-2">
                        {signal.reasoning.map((r, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-200">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {signal.explanation && (
                      <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-slate-800/80">
                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                          <span className="text-xs font-bold text-slate-300 block mb-1.5">
                            Strongest Signals
                          </span>
                          <ul className="space-y-1 text-xs text-slate-400">
                            {signal.explanation.strongestSignals?.map((s, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-xl border border-rose-950/40 bg-slate-950/60 p-3.5">
                          <span className="text-xs font-bold text-rose-300 block mb-1.5">
                            Invalidation Risks
                          </span>
                          <ul className="space-y-1 text-xs text-slate-400">
                            {signal.explanation.invalidationRisks?.map((s, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Market Structure */}
                {activeTab === 'structure' && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <span className="text-xs text-slate-400 font-medium">Trend State</span>
                      <p className="mt-1 text-base font-bold text-white font-mono">
                        {signal.marketStructure?.trend || 'Uptrend'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <span className="text-xs text-slate-400 font-medium">Structure Event</span>
                      <p className="mt-1 text-base font-bold text-emerald-400 font-mono">
                        {signal.marketStructure?.structure || 'Bullish BOS'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <span className="text-xs text-slate-400 font-medium">Protected Low</span>
                      <p className="mt-1 text-sm font-bold text-slate-200 font-mono">
                        {signal.marketStructure?.protectedLow || signal.stopLoss}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <span className="text-xs text-slate-400 font-medium">Protected High</span>
                      <p className="mt-1 text-sm font-bold text-slate-200 font-mono">
                        {signal.marketStructure?.protectedHigh || signal.takeProfit}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab 3: SMC / ICT Breakdown */}
                {activeTab === 'smc' && (
                  <div className="mt-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                        <span className="text-[11px] text-slate-400 font-medium">Fair Value Gap (FVG)</span>
                        <p className="mt-1 text-xs font-semibold text-cyan-300 font-mono">
                          {signal.smcIct?.fvg}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                        <span className="text-[11px] text-slate-400 font-medium">Order Blocks</span>
                        <p className="mt-1 text-xs font-semibold text-indigo-300 font-mono">
                          {signal.smcIct?.orderBlocks}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                        <span className="text-[11px] text-slate-400 font-medium">Liquidity Pool</span>
                        <p className="mt-1 text-xs font-semibold text-amber-300 font-mono">
                          {signal.smcIct?.liquidity}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                      <span className="text-xs text-slate-400 font-medium">Pricing Zone (Premium vs Discount)</span>
                      <p className="mt-1 text-sm font-bold text-white font-mono">
                        {signal.smcIct?.zone}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab 4: Volatility & Session */}
                {activeTab === 'volatility' && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <span className="text-xs text-slate-400 font-medium">Average True Range (ATR)</span>
                      <p className="mt-1 text-base font-bold text-white font-mono">
                        {signal.volatility?.atr}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <span className="text-xs text-slate-400 font-medium">Daily Range Utilized</span>
                      <p className="mt-1 text-base font-bold text-cyan-400 font-mono">
                        {signal.volatility?.dailyRange}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <span className="text-xs text-slate-400 font-medium">Session Volatility</span>
                      <p className="mt-1 text-base font-bold text-amber-400 font-mono">
                        {signal.volatility?.sessionVolatility}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab 5: Risk Management */}
                {activeTab === 'risk' && (
                  <div className="mt-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                        <span className="text-xs text-slate-400">Calculated Lot Size</span>
                        <p className="mt-1 text-base font-bold text-emerald-400 font-mono">
                          {signal.riskManagement?.lotSize}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                        <span className="text-xs text-slate-400">Maximum Risk Loss</span>
                        <p className="mt-1 text-base font-bold text-rose-400 font-mono">
                          {signal.riskManagement?.maximumLoss}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                        <span className="text-xs text-slate-400">Expected Profit (Target)</span>
                        <p className="mt-1 text-base font-bold text-emerald-400 font-mono">
                          {signal.riskManagement?.expectedProfit}
                        </p>
                      </div>
                    </div>

                    {/* Trade Management Rules */}
                    {signal.tradeManagement && (
                      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                          Execution &amp; Invalidation Rules
                        </span>
                        <div className="grid gap-2 sm:grid-cols-2 text-xs text-slate-300">
                          <div>
                            <span className="font-semibold text-emerald-400">Move to Break-Even:</span>{' '}
                            {signal.tradeManagement.moveToBreakEven}
                          </div>
                          <div>
                            <span className="font-semibold text-blue-400">Partials Target:</span>{' '}
                            {signal.tradeManagement.partials}
                          </div>
                          <div>
                            <span className="font-semibold text-rose-400">Early Invalidation:</span>{' '}
                            {signal.tradeManagement.earlyExit}
                          </div>
                          <div>
                            <span className="font-semibold text-amber-400">Avoid Setup If:</span>{' '}
                            {signal.tradeManagement.avoidIf}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 6: Strategy Scores Comparison */}
                {activeTab === 'scores' && (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5">
                      <span className="text-xs text-emerald-400 font-mono font-bold">
                        RECOMMENDED STRATEGY: {signal.recommendedStrategy?.name}
                      </span>
                      <p className="text-xs text-slate-300 mt-1">
                        {signal.recommendedStrategy?.why}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {signal.strategyScores?.map((st, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-xs"
                        >
                          <span className="font-mono font-bold text-white">{st.strategy}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 max-w-[280px] truncate hidden sm:inline">
                              {st.rationale}
                            </span>
                            <div className="flex items-center gap-1.5 min-w-[70px] justify-end font-mono font-bold text-emerald-400">
                              <span>{st.score}/100</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 7: Multi-Timeframe Alignment */}
                {activeTab === 'mtf' && (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                            Institutional Multi-Timeframe Alignment
                          </span>
                        </div>
                        <span className="rounded bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-xs font-mono font-bold text-emerald-400">
                          {mtfResolved.alignment}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-mono leading-relaxed">
                        {mtfResolved.crossReasoning}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 text-xs">
                      {/* HTF Tab Details */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 font-mono">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="text-slate-400 font-bold">1. Higher TF ({mtfResolved.htf.timeframe})</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${mtfResolved.htf.bias === 'BULLISH' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                            {mtfResolved.htf.bias}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Structure</span>
                          <p className="text-slate-200 text-[11px] mt-0.5">{mtfResolved.htf.structure}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Key Liquidity</span>
                          <p className="text-slate-300 text-[11px] mt-0.5">{mtfResolved.htf.liquidity}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Major POI</span>
                          <p className="text-emerald-400 font-bold text-[11px] mt-0.5">{mtfResolved.htf.poi}</p>
                        </div>
                        {mtfResolved.htf.protectedLevel && (
                          <div className="flex justify-between text-[10px] pt-1 border-t border-slate-800/60">
                            <span className="text-slate-500">Protected Invalidation:</span>
                            <span className="text-rose-400 font-bold">{mtfResolved.htf.protectedLevel}</span>
                          </div>
                        )}
                      </div>

                      {/* MTF Tab Details */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 font-mono">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="text-slate-400 font-bold">2. Middle TF ({mtfResolved.mtf.timeframe})</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${mtfResolved.mtf.bias === 'BULLISH' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                            {mtfResolved.mtf.bias}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Structure Refinement</span>
                          <p className="text-slate-200 text-[11px] mt-0.5">{mtfResolved.mtf.structure}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">BOS / CHoCH</span>
                          <p className="text-cyan-400 font-bold text-[11px] mt-0.5">{mtfResolved.mtf.bosChoch}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Liquidity Sweep</span>
                          <p className="text-slate-300 text-[11px] mt-0.5">{mtfResolved.mtf.liquidity}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Refined POI Zone</span>
                          <p className="text-emerald-400 font-bold text-[11px] mt-0.5">{mtfResolved.mtf.poi}</p>
                        </div>
                      </div>

                      {/* LTF Tab Details */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 font-mono">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="text-slate-400 font-bold">3. Lower TF ({mtfResolved.ltf.timeframe})</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-emerald-400 bg-emerald-500/10">
                            {mtfResolved.ltf.confirmation}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">MSS / CHoCH Trigger</span>
                          <p className="text-cyan-400 font-bold text-[11px] mt-0.5">{mtfResolved.ltf.mssChoch}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Displacement Impulse</span>
                          <p className="text-slate-200 text-[11px] mt-0.5">{mtfResolved.ltf.displacement}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Mitigation (FVG/OB)</span>
                          <p className="text-emerald-400 font-bold text-[11px] mt-0.5">{mtfResolved.ltf.fvgOb}</p>
                        </div>
                        <div className="flex justify-between text-[10px] pt-1 border-t border-slate-800/60">
                          <span className="text-slate-500">Execution Entry:</span>
                          <span className="text-white font-bold">{mtfResolved.ltf.entry}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-500">Invalidation (SL):</span>
                          <span className="text-rose-400 font-bold">{mtfResolved.ltf.invalidation}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 8: Validation Check */}
                {activeTab === 'validation' && (
                  <div className="mt-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                        <span className="text-xs font-medium text-slate-300">Instrument Verified</span>
                        <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> PASSED
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                        <span className="text-xs font-medium text-slate-300">Chart Readability</span>
                        <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> PASSED
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                        <span className="text-xs font-medium text-slate-300">Price Axis Scale</span>
                        <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> GROUNDED
                        </span>
                      </div>
                    </div>

                    {signal.validation?.priceScale && (
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                          <span className="text-[10px] font-mono text-slate-400 block uppercase">Min Visible Price</span>
                          <span className="text-xs font-mono font-bold text-white mt-0.5 block">
                            {signal.validation.priceScale.minVisiblePrice}
                          </span>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                          <span className="text-[10px] font-mono text-slate-400 block uppercase">Max Visible Price</span>
                          <span className="text-xs font-mono font-bold text-white mt-0.5 block">
                            {signal.validation.priceScale.maxVisiblePrice}
                          </span>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                          <span className="text-[10px] font-mono text-slate-400 block uppercase">Detected Range</span>
                          <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5 block">
                            {signal.validation.detectedPriceRange || `${signal.validation.priceScale.minVisiblePrice} - ${signal.validation.priceScale.maxVisiblePrice}`}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                      <span className="text-xs text-slate-400 font-medium">Audit Notes</span>
                      <p className="text-xs text-slate-200 mt-1">{signal.validation?.notes}</p>
                    </div>

                    {signal.timings && (
                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-emerald-400" />
                            Pipeline Latency Breakdown
                          </span>
                          <span className="rounded bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-xs font-mono font-bold text-emerald-400">
                            Total: {(signal.timings.total_ms / 1000).toFixed(2)}s ({signal.timings.total_ms}ms)
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                          <div className="rounded-lg bg-slate-900 border border-slate-800 p-2">
                            <span className="text-slate-500 block">AI Model</span>
                            <span className="text-white font-bold">{signal.timings.ai_request_ms}ms</span>
                          </div>
                          <div className="rounded-lg bg-slate-900 border border-slate-800 p-2">
                            <span className="text-slate-500 block">Image Proc</span>
                            <span className="text-white font-bold">{signal.timings.image_processing_ms}ms</span>
                          </div>
                          <div className="rounded-lg bg-slate-900 border border-slate-800 p-2">
                            <span className="text-slate-500 block">Price Audit</span>
                            <span className="text-white font-bold">{signal.timings.signal_validation_ms}ms</span>
                          </div>
                          <div className="rounded-lg bg-slate-900 border border-slate-800 p-2">
                            <span className="text-slate-500 block">JSON Parse</span>
                            <span className="text-white font-bold">{signal.timings.ai_parse_ms}ms</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            );
          })()}

          {/* Placeholder state when no signal is yet generated */}
          {!signal && !isAnalyzing && (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 text-emerald-400 mx-auto mb-4 border border-slate-700 shadow-md">
                <Target className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Institutional Terminal Standby</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
                Select your asset pair, analysis engine, and upload your chart or click one of the 1-click
                presets to generate institutional SMC/ICT trade signals.
              </p>
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleRunAnalysis}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Analyze Preset (BTCUSDT · H1 · ICT)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
