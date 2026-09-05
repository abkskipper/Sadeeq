import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Target,
  Sparkles,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { ChartAnnotation, TradeSignal } from '../types';

interface AnnotatedChartCanvasProps {
  signal: TradeSignal;
  activeTimeframeView?: 'LTF' | 'MTF' | 'HTF';
  onTimeframeViewChange?: (view: 'LTF' | 'MTF' | 'HTF') => void;
}

export const AnnotatedChartCanvas: React.FC<AnnotatedChartCanvasProps> = ({
  signal,
  activeTimeframeView = 'LTF',
  onTimeframeViewChange,
}) => {
  const [showLevels, setShowLevels] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showStructure, setShowStructure] = useState(true);
  const [showSessions, setShowSessions] = useState(true);
  const [selectedAnnotation, setSelectedAnnotation] = useState<ChartAnnotation | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Select annotations for the active view
  let currentAnnotations = signal.annotations || [];
  if (activeTimeframeView === 'HTF' && signal.annotationsHtf && signal.annotationsHtf.length > 0) {
    currentAnnotations = signal.annotationsHtf;
  } else if (activeTimeframeView === 'MTF' && signal.annotationsMtf && signal.annotationsMtf.length > 0) {
    currentAnnotations = signal.annotationsMtf;
  } else if (signal.annotationsLtf && signal.annotationsLtf.length > 0) {
    currentAnnotations = signal.annotationsLtf;
  }

  // Get active chart image
  const chartImage =
    activeTimeframeView === 'HTF'
      ? signal.chartImages?.htf || signal.chartImages?.single
      : activeTimeframeView === 'MTF'
      ? signal.chartImages?.mtf || signal.chartImages?.single
      : signal.chartImages?.ltf || signal.chartImages?.single;

  const hasMultiCharts = Boolean(signal.chartImages?.htf || signal.chartImages?.mtf);

  return (
    <div className="flex flex-col rounded-2xl border border-slate-800 bg-[#0d121c] overflow-hidden shadow-xl">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <Target className="h-4 w-4 text-emerald-400" />
            <span>Annotated Institutional Canvas</span>
          </div>

          {/* Timeframe View Switcher if Multi-Chart exists */}
          {hasMultiCharts && onTimeframeViewChange && (
            <div className="flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800 ml-2">
              {(['HTF', 'MTF', 'LTF'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => onTimeframeViewChange(tf)}
                  className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-md transition ${
                    activeTimeframeView === tf
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Layer Filters */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setShowLevels(!showLevels)}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium border transition ${
              showLevels
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Trade Levels
          </button>

          <button
            onClick={() => setShowZones(!showZones)}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium border transition ${
              showZones
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            FVG / Order Blocks
          </button>

          <button
            onClick={() => setShowStructure(!showStructure)}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium border transition ${
              showStructure
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            BOS / CHOCH
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 ml-2 border-l border-slate-800 pl-2">
            <button
              onClick={() => setZoomLevel(Math.max(0.8, zoomLevel - 0.1))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] font-mono text-slate-400 min-w-[32px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(1.5, zoomLevel + 0.1))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        ref={containerRef}
        className="relative w-full overflow-auto bg-[#080b10] flex items-center justify-center p-2 min-h-[420px]"
      >
        <div
          className="relative inline-block select-none transition-transform duration-150 origin-center max-w-full"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Base Chart Image */}
          {chartImage ? (
            <img
              src={chartImage}
              alt={`${signal.asset} ${signal.timeframe} Chart`}
              className="w-full max-h-[560px] object-contain rounded-lg border border-slate-800/80 shadow-2xl block"
            />
          ) : (
            <div className="w-[800px] h-[450px] bg-slate-950 flex flex-col items-center justify-center border border-slate-800 rounded-lg">
              <Sparkles className="h-10 w-10 text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-400">Chart rendering live coordinates...</p>
            </div>
          )}

          {/* SVG Overlay for Coordinates & Bounding Annotations */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Premium / Discount Gradients */}
              <linearGradient id="fvgGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.08" />
              </linearGradient>
              <linearGradient id="obGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Render Annotations */}
            {currentAnnotations.map((ann, idx) => {
              const isLevel = ann.type === 'Entry' || ann.type === 'Stop Loss' || ann.type.startsWith('Take Profit');
              const isZone = ann.type === 'FVG' || ann.type === 'Order Block' || ann.type.includes('Zone') || ann.type.includes('Block');
              const isStruct = ann.type === 'BOS' || ann.type === 'CHOCH' || ann.type.includes('Liquidity') || ann.type.includes('High') || ann.type.includes('Low');
              const isSession = ann.type.includes('Session');

              if (isLevel && !showLevels) return null;
              if (isZone && !showZones) return null;
              if (isStruct && !showStructure) return null;
              if (isSession && !showSessions) return null;

              const x1 = ann.x ?? 15;
              const y1 = ann.y ?? 50;
              const x2 = ann.x2 ?? Math.min(x1 + 35, 95);
              const y2 = ann.y2 ?? (isLevel ? y1 : y1 + 6);

              // 1. Horizontal Level Lines (Entry, SL, TP)
              if (isLevel) {
                const color =
                  ann.type === 'Entry'
                    ? '#10b981'
                    : ann.type === 'Stop Loss'
                    ? '#f43f5e'
                    : '#34d399';
                const strokeDash = ann.type === 'Entry' ? '2,2' : 'none';

                return (
                  <g key={idx} className="pointer-events-auto cursor-pointer" onClick={() => setSelectedAnnotation(ann)}>
                    {/* Shadow / Glow line */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y1}
                      stroke={color}
                      strokeWidth="0.8"
                      strokeOpacity="0.3"
                      strokeDasharray={strokeDash}
                    />
                    {/* Main Line */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y1}
                      stroke={color}
                      strokeWidth="0.4"
                      strokeDasharray={strokeDash}
                    />
                    {/* Level Label Badge on right side */}
                    <rect
                      x={Math.max(x2 - 24, x1)}
                      y={y1 - 2.2}
                      width="23"
                      height="4.2"
                      fill="#0b0e14"
                      stroke={color}
                      strokeWidth="0.3"
                      rx="0.8"
                    />
                    <text
                      x={Math.max(x2 - 23, x1 + 1)}
                      y={y1 + 0.8}
                      fill={color}
                      fontSize="2.2"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {ann.label}
                    </text>
                  </g>
                );
              }

              // 2. Zone Boxes (FVG, Order Block, Supply/Demand)
              if (isZone) {
                const isOB = ann.type === 'Order Block';
                const fillColor = isOB ? 'url(#obGlow)' : 'url(#fvgGlow)';
                const strokeColor = isOB ? '#818cf8' : '#38bdf8';
                const width = Math.max(Math.abs(x2 - x1), 10);
                const height = Math.max(Math.abs(y2 - y1), 3);
                const boxY = Math.min(y1, y2);
                const boxX = Math.min(x1, x2);

                return (
                  <g key={idx} className="pointer-events-auto cursor-pointer" onClick={() => setSelectedAnnotation(ann)}>
                    <rect
                      x={boxX}
                      y={boxY}
                      width={width}
                      height={height}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth="0.3"
                      strokeDasharray="1,1"
                      rx="0.5"
                    />
                    <text
                      x={boxX + 1}
                      y={boxY + 2.2}
                      fill={strokeColor}
                      fontSize="1.9"
                      fontWeight="600"
                      fontFamily="sans-serif"
                    >
                      {ann.label}
                    </text>
                  </g>
                );
              }

              // 3. Structure Lines & Liquidity Sweeps
              if (isStruct) {
                const isSweep = ann.type.includes('Sweep') || ann.type.includes('Liquidity');
                const strokeColor = isSweep ? '#fbbf24' : '#c084fc';
                return (
                  <g key={idx} className="pointer-events-auto cursor-pointer" onClick={() => setSelectedAnnotation(ann)}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y1}
                      stroke={strokeColor}
                      strokeWidth="0.35"
                      strokeDasharray="2,1"
                    />
                    <circle cx={x1} cy={y1} r="0.8" fill={strokeColor} />
                    <text
                      x={x1 + 1.5}
                      y={y1 - 1.2}
                      fill={strokeColor}
                      fontSize="1.9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {ann.label}
                    </text>
                  </g>
                );
              }

              return null;
            })}
          </svg>
        </div>
      </div>

      {/* Selected Annotation Details Footer if clicked */}
      {selectedAnnotation && (
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-4 py-2 text-xs">
          <div className="flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-mono font-bold text-slate-200">{selectedAnnotation.label}</span>
            {selectedAnnotation.price && (
              <span className="text-emerald-400 font-mono">({selectedAnnotation.price})</span>
            )}
            <span className="text-slate-400">Type: {selectedAnnotation.type}</span>
          </div>
          <button
            onClick={() => setSelectedAnnotation(null)}
            className="text-slate-500 hover:text-slate-300 text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
