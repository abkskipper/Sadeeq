import React from 'react';
import {
  Shield,
  Layers,
  Activity,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  LineChart,
  Target,
  Gauge,
  Clock,
  ShieldCheck,
  TrendingUp,
  Cpu,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface LandingPageProps {
  onOpenTerminal: () => void;
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenTerminal, onOpenAuth }) => {
  const scrollToEngine = () => {
    const el = document.getElementById('analysis-engine-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* ------------------------------------------------------------- */}
      {/* 2. PRIMARY HERO SECTION */}
      {/* ------------------------------------------------------------- */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[250px] bg-blue-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
          {/* AI Mode Tag */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-4 py-1.5 text-xs font-medium text-emerald-400 backdrop-blur-md shadow-sm mb-6 animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono font-semibold">AI engine v2</span>
            <span className="text-emerald-600">•</span>
            <span>institutional analyst mode</span>
          </div>

          {/* Primary Headline */}
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl max-w-4xl mx-auto leading-[1.15]">
            Chart-aware AI that trades like an{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              institutional analyst
            </span>
            .
          </h1>

          {/* Primary Description */}
          <p className="mt-6 text-base text-slate-300 sm:text-lg md:text-xl max-w-3xl mx-auto font-normal leading-relaxed">
            TradeGuard reads your chart the way a prop trader does — market structure, SMC / ICT setups,
            liquidity, FVGs, session context, volatility, and risk. No generic recommendations. Every
            signal is anchored to the exact pair, timeframe, and price action.
          </p>

          {/* Primary Actions */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onOpenTerminal}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 hover:shadow-emerald-500/40 active:scale-[0.98] transition cursor-pointer"
            >
              <Sparkles className="h-4 w-4 fill-slate-950" />
              Analyze a chart
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={scrollToEngine}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              How it works
            </button>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* 3, 4, 5, 6. SUPPORTED PAIRS, TIMEFRAMES, ENGINES, OUTPUT BAR */}
          {/* ------------------------------------------------------------- */}
          <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 max-w-4xl mx-auto">
            {/* Pairs */}
            <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-4 backdrop-blur-sm text-left">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Pairs
              </span>
              <p className="mt-1 text-sm font-bold text-white tracking-wide">
                FX • Crypto • Indices • Gold
              </p>
            </div>

            {/* Timeframes */}
            <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-4 backdrop-blur-sm text-left">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Timeframes
              </span>
              <p className="mt-1 text-sm font-bold text-emerald-400 font-mono tracking-wide">
                M1 → W1
              </p>
            </div>

            {/* Engines */}
            <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-4 backdrop-blur-sm text-left">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Engines
              </span>
              <p className="mt-1 text-sm font-bold text-white tracking-wide">
                SMC • ICT • Price Action
              </p>
            </div>

            {/* Output */}
            <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-4 backdrop-blur-sm text-left">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Output
              </span>
              <p className="mt-1 text-sm font-bold text-cyan-400 font-mono tracking-wide">
                Entry / SL / TP / RR
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. THE ANALYSIS ENGINE (Seven Layers) */}
      {/* ------------------------------------------------------------- */}
      <section id="analysis-engine-section" className="border-t border-slate-800/80 py-20 bg-[#080b10]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono">
              The analysis engine
            </h2>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Seven layers between your chart and a signal
            </p>
            <p className="mt-4 text-base text-slate-400 leading-relaxed">
              Generic &quot;BUY&quot; calls don&apos;t survive a real market. Every TradeGuard analysis
              runs through the same checklist a desk-side analyst would.
            </p>
          </div>

          {/* 7 Layers Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Layer 1 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition hover:border-slate-700 hover:bg-slate-900/90 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-105 transition">
                  <Lock className="h-5 w-5" />
                </div>
                <span className="text-xs font-mono font-bold text-blue-400">LAYER 01</span>
              </div>
              <h3 className="text-lg font-bold text-white">Asset &amp; timeframe lock</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Pair, timeframe and instrument type drive the entire pip math and target sizing.
              </p>
            </div>

            {/* Layer 2 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition hover:border-slate-700 hover:bg-slate-900/90 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition">
                  <LineChart className="h-5 w-5" />
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">LAYER 02</span>
              </div>
              <h3 className="text-lg font-bold text-white">Market structure</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Trend, ranges, breakouts and reversals identified before strategy is applied.
              </p>
            </div>

            {/* Layer 3 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition hover:border-slate-700 hover:bg-slate-900/90 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-105 transition">
                  <Target className="h-5 w-5" />
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400">LAYER 03</span>
              </div>
              <h3 className="text-lg font-bold text-white">SMC / ICT detection</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                BOS, CHOCH, FVGs, order blocks, liquidity sweeps, premium / discount zones.
              </p>
            </div>

            {/* Layer 4 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition hover:border-slate-700 hover:bg-slate-900/90 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-105 transition">
                  <Gauge className="h-5 w-5" />
                </div>
                <span className="text-xs font-mono font-bold text-amber-400">LAYER 04</span>
              </div>
              <h3 className="text-lg font-bold text-white">Volatility engine</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                ATR and session range keep targets realistic for the current regime.
              </p>
            </div>

            {/* Layer 5 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition hover:border-slate-700 hover:bg-slate-900/90 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-105 transition">
                  <Clock className="h-5 w-5" />
                </div>
                <span className="text-xs font-mono font-bold text-purple-400">LAYER 05</span>
              </div>
              <h3 className="text-lg font-bold text-white">Session context</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Asia, London, NY and overlap — bias adjusts to who&apos;s actually trading.
              </p>
            </div>

            {/* Layer 6 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition hover:border-slate-700 hover:bg-slate-900/90 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 group-hover:scale-105 transition">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="text-xs font-mono font-bold text-rose-400">LAYER 06</span>
              </div>
              <h3 className="text-lg font-bold text-white">Risk management</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Lot size, position size, max loss and expected profit calculated per setup.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 14. SAMPLE OUTPUT SECTION */}
      {/* ------------------------------------------------------------- */}
      <section className="border-t border-slate-800/80 py-20 bg-[#0b0e14]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">
              Signal Output
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-white">What TradeGuard returns</p>
          </div>

          {/* Institutional Signal Ticket Card */}
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-slate-900/90 to-[#0d121c] p-6 sm:p-8 shadow-2xl shadow-emerald-950/20">
            {/* Header: BULLISH BTCUSDT · H1 · ICT with CONF 89% */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-extrabold text-emerald-400 font-mono tracking-wider">
                  BULLISH
                </span>
                <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
                  BTCUSDT · H1 · ICT
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-slate-800/80 border border-slate-700 px-3.5 py-1.5">
                <span className="text-xs text-slate-400 font-mono">CONF</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">89%</span>
              </div>
            </div>

            {/* Key Level Metrics Grid */}
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <span className="text-xs text-slate-400 font-medium">Entry</span>
                <p className="mt-1 text-lg font-bold text-white font-mono">105,250</p>
              </div>

              <div className="rounded-xl border border-rose-950/40 bg-slate-950/60 p-4">
                <span className="text-xs text-rose-400 font-medium">Stop Loss</span>
                <p className="mt-1 text-lg font-bold text-rose-400 font-mono">104,800</p>
              </div>

              <div className="rounded-xl border border-emerald-950/40 bg-slate-950/60 p-4">
                <span className="text-xs text-emerald-400 font-medium">Take Profit</span>
                <p className="mt-1 text-lg font-bold text-emerald-400 font-mono">106,600</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <span className="text-xs text-slate-400 font-medium">Risk : Reward</span>
                <p className="mt-1 text-lg font-bold text-cyan-400 font-mono">1 : 3</p>
              </div>
            </div>

            {/* Reasoning List */}
            <div className="mt-6 rounded-xl border border-slate-800/80 bg-slate-950/40 p-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Reasoning
              </span>
              <ul className="mt-3 space-y-2.5">
                <li className="flex items-start gap-2.5 text-sm text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Bullish BOS on H1</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Liquidity sweep below 104,900</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>FVG retest at 105,300</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>NY session momentum</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 15. FINAL CALL TO ACTION */}
      {/* ------------------------------------------------------------- */}
      <section className="border-t border-slate-800/80 py-20 bg-gradient-to-b from-[#080b10] to-[#0b0e14]">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Stop guessing. Start reading the chart.
          </h2>
          <p className="mt-4 text-base text-slate-400 max-w-xl mx-auto">
            Free to try. Sign in and analyze your first chart in under a minute.
          </p>
          <div className="mt-8">
            <button
              onClick={onOpenTerminal}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 text-base font-bold text-slate-950 shadow-xl shadow-emerald-500/25 hover:bg-emerald-400 hover:shadow-emerald-500/40 active:scale-[0.98] transition cursor-pointer"
            >
              <Sparkles className="h-5 w-5 fill-slate-950" />
              Launch terminal
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 16. FOOTER */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-slate-800/60 py-8 bg-[#07090e]">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <p className="text-xs text-slate-400 font-mono">
            TradeGuard · Educational tool — not financial advice
          </p>
        </div>
      </footer>
    </div>
  );
};
