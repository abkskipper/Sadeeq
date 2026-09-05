// High quality sample chart data generators & presets for instant testing
import { AssetClass, Timeframe, Strategy } from '../types';

export interface SampleChartPreset {
  id: string;
  asset: string;
  assetClass: AssetClass;
  timeframe: Timeframe;
  strategy: Strategy;
  title: string;
  description: string;
  dataUrl: string;
}

// Generate realistic SVG chart images as base64 data URLs
export function generateCandlestickChartSvg(
  asset: string,
  timeframe: string,
  bias: 'bullish' | 'bearish',
  startPrice: number,
  volatility: number
): string {
  const width = 1200;
  const height = 675;
  const candleCount = 48;
  const candleWidth = (width - 160) / candleCount;
  
  let currentPrice = startPrice;
  const candles: Array<{ open: number; close: number; high: number; low: number; vol: number }> = [];

  let minPrice = Infinity;
  let maxPrice = -Infinity;

  for (let i = 0; i < candleCount; i++) {
    const trendStep = bias === 'bullish' ? 0.35 : -0.35;
    const change = (Math.random() - 0.45 + trendStep) * volatility;
    const open = currentPrice;
    const close = open + change;
    const wickHigh = Math.random() * (volatility * 0.7);
    const wickLow = Math.random() * (volatility * 0.7);
    const high = Math.max(open, close) + wickHigh;
    const low = Math.min(open, close) - wickLow;
    const vol = Math.floor(Math.random() * 80 + 20);

    candles.push({ open, close, high, low, vol });
    minPrice = Math.min(minPrice, low);
    maxPrice = Math.max(maxPrice, high);
    currentPrice = close;
  }

  const priceRange = maxPrice - minPrice || 1;
  const paddingY = 60;
  const chartHeight = height - paddingY * 2 - 80;

  const priceToY = (price: number) => {
    return paddingY + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  };

  let candleElements = '';
  let volumeElements = '';

  candles.forEach((c, i) => {
    const x = 60 + i * candleWidth;
    const isGreen = c.close >= c.open;
    const color = isGreen ? '#10b981' : '#f43f5e';
    const wickX = x + candleWidth / 2;
    const openY = priceToY(c.open);
    const closeY = priceToY(c.close);
    const highY = priceToY(c.high);
    const lowY = priceToY(c.low);
    const topY = Math.min(openY, closeY);
    const bodyHeight = Math.max(Math.abs(closeY - openY), 2);

    // Wick
    candleElements += `<line x1="${wickX}" y1="${highY}" x2="${wickX}" y2="${lowY}" stroke="${color}" stroke-width="1.5" />`;
    // Body
    candleElements += `<rect x="${x + 2}" y="${topY}" width="${Math.max(candleWidth - 4, 3)}" height="${bodyHeight}" fill="${color}" rx="1" />`;

    // Volume bar
    const volHeight = (c.vol / 100) * 60;
    const volY = height - 30 - volHeight;
    volumeElements += `<rect x="${x + 2}" y="${volY}" width="${Math.max(candleWidth - 4, 3)}" height="${volHeight}" fill="${color}" opacity="0.25" />`;
  });

  // Price axis gridlines
  let gridLines = '';
  const gridCount = 6;
  for (let g = 0; g <= gridCount; g++) {
    const p = minPrice + (priceRange / gridCount) * g;
    const y = priceToY(p);
    const formattedPrice = p > 1000 ? p.toFixed(2) : p.toFixed(4);
    gridLines += `
      <line x1="60" y1="${y}" x2="${width - 110}" y2="${y}" stroke="#1f293d" stroke-dasharray="3 3" stroke-width="1" />
      <rect x="${width - 105}" y="${y - 9}" width="95" height="18" fill="#0f172a" stroke="#334155" stroke-width="1" rx="3" />
      <text x="${width - 98}" y="${y + 4}" fill="#94a3b8" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="13" font-weight="600">${formattedPrice}</text>
    `;
  }

  // Time gridlines
  let timeLabels = '';
  for (let t = 0; t < candleCount; t += 8) {
    const x = 60 + t * candleWidth;
    gridLines += `<line x1="${x}" y1="${paddingY}" x2="${x}" y2="${height - 90}" stroke="#161f30" stroke-width="1" />`;
    timeLabels += `<text x="${x - 10}" y="${height - 12}" fill="#64748b" font-family="'JetBrains Mono', monospace" font-size="11">T-${candleCount - t} ${timeframe}</text>`;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: #0b0e14;">
      <defs>
        <linearGradient id="bgGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0e1524" />
          <stop offset="100%" stop-color="#080a0f" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bgGlow)" />
      
      <!-- Watermark / Brand Context -->
      <text x="70" y="40" fill="#334155" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="22" letter-spacing="1">TRADEGUARD AI · INSTITUTIONAL TERMINAL</text>
      <text x="70" y="65" fill="#38bdf8" font-family="'JetBrains Mono', monospace" font-weight="700" font-size="15">${asset} · ${timeframe} · VISIBLE PRICE AXIS</text>
      <text x="${width - 240}" y="40" fill="#10b981" font-family="'JetBrains Mono', monospace" font-size="12">● PRICE SCALE VERIFIED</text>
      
      <!-- Grid & Axes -->
      ${gridLines}
      ${timeLabels}
      
      <!-- Volume Area -->
      <line x1="60" y1="${height - 90}" x2="${width - 110}" y2="${height - 90}" stroke="#1e293b" stroke-width="1.5" />
      <text x="70" y="${height - 95}" fill="#475569" font-family="'JetBrains Mono', monospace" font-size="10">VOL (SMA 20)</text>
      ${volumeElements}

      <!-- Candlesticks -->
      ${candleElements}

      <!-- Current Price Badge on Axis -->
      <rect x="${width - 105}" y="${priceToY(currentPrice) - 11}" width="95" height="22" fill="${currentPrice >= startPrice ? '#10b981' : '#f43f5e'}" rx="4" />
      <text x="${width - 98}" y="${priceToY(currentPrice) + 4}" fill="#ffffff" font-family="'JetBrains Mono', monospace" font-weight="800" font-size="13">${currentPrice > 1000 ? currentPrice.toFixed(2) : currentPrice.toFixed(4)}</text>
    </svg>
  `;

  // Return base64 encoded data url
  const base64 = typeof btoa !== 'undefined'
    ? btoa(unescape(encodeURIComponent(svg)))
    : Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

export interface MultiTimeframeChartSet {
  htf: string;
  mtf: string;
  ltf: string;
  htfTimeframe: Timeframe;
  mtfTimeframe: Timeframe;
  ltfTimeframe: Timeframe;
}

export function generateMultiTimeframeChartSet(
  asset: string,
  basePrice: number,
  volatility: number,
  bias: 'bullish' | 'bearish' = 'bullish',
  htfTf: Timeframe = 'H4',
  mtfTf: Timeframe = 'H1',
  ltfTf: Timeframe = 'M15'
): MultiTimeframeChartSet {
  return {
    htf: generateCandlestickChartSvg(asset, htfTf, bias, basePrice, volatility * 2.2),
    mtf: generateCandlestickChartSvg(asset, mtfTf, bias, basePrice + (bias === 'bullish' ? -volatility * 0.4 : volatility * 0.4), volatility * 1.4),
    ltf: generateCandlestickChartSvg(asset, ltfTf, bias, basePrice, volatility * 0.8),
    htfTimeframe: htfTf,
    mtfTimeframe: mtfTf,
    ltfTimeframe: ltfTf,
  };
}

export const SAMPLE_CHARTS: SampleChartPreset[] = [
  {
    id: 'btc-h1-ict',
    asset: 'BTCUSDT',
    assetClass: 'Crypto',
    timeframe: 'H1',
    strategy: 'ICT',
    title: 'BTC/USDT H1 — ICT Liquidity Sweep Setup',
    description: 'Bullish BOS with FVG retest after Asian session low sweep',
    dataUrl: generateCandlestickChartSvg('BTCUSDT', 'H1', 'bullish', 104850, 420),
  },
  {
    id: 'eurusd-m15-smc',
    asset: 'EURUSD',
    assetClass: 'Forex',
    timeframe: 'M15',
    strategy: 'SMC',
    title: 'EUR/USD M15 — SMC Order Block Mitigation',
    description: 'Bearish CHOCH followed by premium discount supply re-test',
    dataUrl: generateCandlestickChartSvg('EURUSD', 'M15', 'bearish', 1.0895, 0.0014),
  },
  {
    id: 'xauusd-h4-smc',
    asset: 'XAUUSD',
    assetClass: 'Commodities',
    timeframe: 'H4',
    strategy: 'SMC',
    title: 'XAU/USD H4 (Gold) — Institutional Demand Zone',
    description: 'Protected low defense with London session volume breakout',
    dataUrl: generateCandlestickChartSvg('XAUUSD', 'H4', 'bullish', 4594.2, 24.5),
  },
  {
    id: 'nas100-m5-price-action',
    asset: 'NAS100',
    assetClass: 'Indices',
    timeframe: 'M5',
    strategy: 'Price Action',
    title: 'NAS100 M5 — NY Open Momentum Breakout',
    description: 'High-probability range expansion above pre-market high',
    dataUrl: generateCandlestickChartSvg('NAS100', 'M5', 'bullish', 21450, 65),
  },
];

export function getMultiTimeframeSetForPreset(presetId: string): MultiTimeframeChartSet {
  switch (presetId) {
    case 'btc-h1-ict':
      return generateMultiTimeframeChartSet('BTCUSDT', 104850, 420, 'bullish', 'H4', 'H1', 'M15');
    case 'eurusd-m15-smc':
      return generateMultiTimeframeChartSet('EURUSD', 1.0895, 0.0014, 'bearish', 'H1', 'M15', 'M5');
    case 'xauusd-h4-smc':
      return generateMultiTimeframeChartSet('XAUUSD', 4594.2, 24.5, 'bullish', 'D1', 'H4', 'H1');
    case 'nas100-m5-price-action':
      return generateMultiTimeframeChartSet('NAS100', 21450, 65, 'bullish', 'H1', 'M15', 'M5');
    default:
      return generateMultiTimeframeChartSet('BTCUSDT', 104850, 420, 'bullish', 'H4', 'H1', 'M15');
  }
}

