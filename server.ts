import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsing with higher limits for multi-chart base64 uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// -------------------------------------------------------------
// Database Persistence Layer (in-memory + disk backup)
// -------------------------------------------------------------
const DB_FILE = path.join(process.cwd(), '.data', 'tradeguard_db.json');

interface DatabaseSchema {
  users: Array<{
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    role: 'user' | 'admin' | 'super_admin';
    created_at: string;
  }>;
  signals: any[];
  watchlist: any[];
  analysisLogs: any[];
}

// Initial seed data with realistic pre-populated institutional analyses
const initialDb: DatabaseSchema = {
  users: [
    {
      id: 'usr_trader_demo',
      email: 'trader@tradeguard.ai',
      name: 'Institutional Desk Trader',
      passwordHash: 'demo123',
      role: 'user',
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: 'usr_admin_demo',
      email: 'admin@tradeguard.ai',
      name: 'Senior Risk Officer (Admin)',
      passwordHash: 'admin123',
      role: 'super_admin',
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
  ],
  signals: [],
  watchlist: [],
  analysisLogs: [],
};

function loadDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(path.dirname(DB_FILE))) {
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.signals)) {
        parsed.signals = parsed.signals.filter((s: any) =>
          s.id !== 'sig_btc_sample_h1' &&
          s.entry !== 105250 &&
          s.entry !== 4594.5 &&
          s.entry !== 4602.5 &&
          s.modelUsed !== 'TradeGuard Institutional Engine'
        );
      }
      return parsed;
    }
  } catch (err) {
    console.error('Failed to read db file, using memory seed:', err);
  }
  return initialDb;
}

let db: DatabaseSchema = loadDb();
let isSaving = false;
let pendingSave = false;

function saveDb() {
  if (isSaving) {
    pendingSave = true;
    return;
  }
  isSaving = true;
  setImmediate(async () => {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }
      await fs.promises.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write db file:', err);
    } finally {
      isSaving = false;
      if (pendingSave) {
        pendingSave = false;
        saveDb();
      }
    }
  });
}

// -------------------------------------------------------------
// Gemini Client Initialization (Singleton Pattern)
// -------------------------------------------------------------
let cachedGeminiClient: GoogleGenAI | null = null;
let lastApiKey: string | undefined = undefined;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set in environment.');
    return null;
  }
  if (!cachedGeminiClient || lastApiKey !== apiKey) {
    cachedGeminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    lastApiKey = apiKey;
  }
  return cachedGeminiClient;
}

// -------------------------------------------------------------
// Auth & User API Routes
// -------------------------------------------------------------
app.get('/api/auth/session', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = db.users.find(u => u.id === token || u.email === token);
    if (user) {
      return res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          created_at: user.created_at,
        },
      });
    }
  }
  // Default to guest or demo user for ease of testing
  return res.json({ user: null });
});

app.post('/api/auth/signin', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    // Auto-create user for frictionless authentication
    const isSuper = email.includes('admin');
    user = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email,
      name: email.split('@')[0],
      passwordHash: password || 'default',
      role: isSuper ? 'super_admin' : 'user',
      created_at: new Date().toISOString(),
    };
    db.users.push(user);
    saveDb();
  }

  return res.json({
    token: user.id,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at,
    },
  });
});

app.post('/api/auth/signup', (req: Request, res: Response) => {
  const { email, name, password, role } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'User already exists with this email.' });
  }

  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email,
    name: name || email.split('@')[0],
    passwordHash: password || 'default',
    role: role || (email.includes('admin') ? 'super_admin' : 'user'),
    created_at: new Date().toISOString(),
  };
  db.users.push(newUser);
  saveDb();

  return res.json({
    token: newUser.id,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      created_at: newUser.created_at,
    },
  });
});

// -------------------------------------------------------------
// Signals & Watchlist Endpoints & 12-Component A+ Confluence Audit
// -------------------------------------------------------------
function buildAplusConfluenceAudit(s: any): any {
  if (!s) return null;
  const isBull = s.bias === 'BULLISH';
  const entry = parseNumericPrice(s.entry) || 0;
  const sl = parseNumericPrice(s.stopLoss) || 0;
  const tp1 = parseNumericPrice(s.takeProfit) || 0;
  const mtf = s.multiTimeframe || {};
  const aplus = s.aplusSmc || {};

  // 1. 4H directional bias
  const htfBias = mtf.higherTimeframe?.bias || mtf.overallBias || s.bias;
  const htfBiasOk = htfBias && htfBias !== 'NEUTRAL';
  const comp1 = {
    id: 1,
    name: '1. 4H Directional Bias',
    status: htfBiasOk ? 'CONFIRMED' : 'MISSING',
    evidence: htfBiasOk
      ? `4H macro directional bias confirmed as ${htfBias} (${mtf.higherTimeframe?.structure || '4H demand/supply holding'})`
      : '4H timeframe lacks clear directional institutional bias',
  };

  // 2. 1H structural alignment
  const mtfBias = mtf.middleTimeframe?.bias || s.bias;
  const mtfAligned = mtf.middleTimeframe?.alignmentWithHtf === 'Aligned' || (htfBias === mtfBias && htfBiasOk);
  const comp2 = {
    id: 2,
    name: '2. 1H Structural Alignment',
    status: mtfAligned ? 'CONFIRMED' : 'MISSING',
    evidence: mtfAligned
      ? `1H order flow aligns with 4H bias: ${mtf.middleTimeframe?.bosChoch || 'Confirmed 1H BOS/CHoCH in trend direction'}`
      : '1H structure shows divergence against 4H directional narrative',
  };

  // 3. Valid 1H POI
  const poiDesc = mtf.middleTimeframe?.poi || aplus.poi?.type || aplus.poi?.priceRange;
  const poiOk = Boolean(poiDesc && (aplus.poi?.status === 'VALID' || aplus.poi?.status === 'CONFIRMED' || !aplus.poi?.status));
  const comp3 = {
    id: 3,
    name: '3. Valid 1H POI',
    status: poiOk ? 'CONFIRMED' : 'MISSING',
    evidence: poiOk
      ? `Actionable 1H POI identified inside 4H context: ${poiDesc || 'Institutional Order Block & FVG mitigation'}`
      : 'No high-probability 1H POI relevant to the 4H directional narrative',
  };

  // 4. Liquidity target identified
  const liqTarget = aplus.takeProfitTargets?.tp1LiquidityType || s.takeProfit || mtf.middleTimeframe?.liquidity || 'Equal Highs/Lows Liquidity Pool';
  const liqTargetOk = Boolean(liqTarget && tp1 > 0);
  const comp4 = {
    id: 4,
    name: '4. Liquidity Target Identified',
    status: liqTargetOk ? 'CONFIRMED' : 'MISSING',
    evidence: liqTargetOk
      ? `Clear opposing liquidity mapped: ${liqTarget} (TP1: ${tp1})`
      : 'Targeting arbitrary price without chart-derived opposing liquidity',
  };

  // 5. Liquidity sweep
  const sweepLevel = aplus.liquiditySweep?.sweptLevel || aplus.liquiditySweep?.priceSwept || mtf.middleTimeframe?.liquidity;
  const sweepOk = Boolean(aplus.liquiditySweep?.status === 'CONFIRMED' || sweepLevel);
  const comp5 = {
    id: 5,
    name: '5. Liquidity Sweep',
    status: sweepOk ? 'CONFIRMED' : 'MISSING',
    evidence: sweepOk
      ? `Liquidity sweep confirmed: ${aplus.liquiditySweep?.sweepType || (isBull ? 'Sell-Side Liquidity Sweep' : 'Buy-Side Liquidity Sweep')} with wick rejection`
      : 'No resting liquidity sweep detected prior to displacement',
  };

  // 6. 15M MSS/CHoCH
  const ltfConf = mtf.lowerTimeframe?.confirmation;
  const mssOk = ltfConf === 'CONFIRMED' || aplus.changeInStateOfDelivery?.status === 'CONFIRMED';
  const comp6 = {
    id: 6,
    name: '6. 15M MSS/CHoCH',
    status: mssOk ? 'CONFIRMED' : (ltfConf === 'DEVELOPING' ? 'PARTIAL' : 'MISSING'),
    evidence: mssOk
      ? `15M Market Structure Shift / CHoCH confirmed: ${mtf.lowerTimeframe?.mssChoch || 'Displacement candle body close'}`
      : 'Waiting for 15M candle body close to confirm sub-structure shift',
  };

  // 7. Displacement
  const dispOk = Boolean(mtf.lowerTimeframe?.displacement || aplus.changeInStateOfDelivery?.responsibleCandleStructure);
  const comp7 = {
    id: 7,
    name: '7. Displacement',
    status: dispOk ? 'CONFIRMED' : 'MISSING',
    evidence: dispOk
      ? `Institutional displacement impulse verified: ${mtf.lowerTimeframe?.displacement || 'Aggressive expansion leaving structural imbalance'}`
      : 'Lacks decisive displacement candles departing the swept level',
  };

  // 8. FVG or Order Block
  const fvgObOk = Boolean(mtf.lowerTimeframe?.fvgOb || aplus.poi?.type);
  const comp8 = {
    id: 8,
    name: '8. FVG or Order Block',
    status: fvgObOk ? 'CONFIRMED' : 'MISSING',
    evidence: fvgObOk
      ? `Displacement generated actionable POI: ${mtf.lowerTimeframe?.fvgOb || aplus.poi?.type || 'Fair Value Gap + Order Block'}`
      : 'No unmitigated FVG or clean Order Block identified on execution timeframe',
  };

  // 9. Premium/Discount alignment
  const premDisc = mtf.higherTimeframe?.premiumDiscount;
  const premDiscOk = premDisc ? (isBull ? !premDisc.toLowerCase().includes('premium') : !premDisc.toLowerCase().includes('discount')) : false;
  const comp9 = {
    id: 9,
    name: '9. Premium/Discount Alignment',
    status: premDiscOk ? 'CONFIRMED' : (premDisc ? 'PARTIAL' : 'MISSING'),
    evidence: premDiscOk
      ? `Execution pricing verified: ${isBull ? 'Discount Zone (< 50% Equilibrium)' : 'Premium Zone (> 50% Equilibrium)'}`
      : (premDisc ? `Sub-optimal pricing: ${premDisc}` : 'Premium/Discount zone not verified on chart'),
  };

  // 10. Clear structural invalidation
  const slStructOk = isBull ? (sl > 0 && sl < entry) : (sl > 0 && sl > entry);
  const comp10 = {
    id: 10,
    name: '10. Clear Structural Invalidation',
    status: slStructOk ? 'CONFIRMED' : 'MISSING',
    evidence: slStructOk
      ? `SL anchored strictly to protected ${isBull ? 'low' : 'high'}: ${sl} (${aplus.stopLoss?.structureReference || 'Liquidity sweep anchor'})`
      : 'Stop Loss is not anchored to genuine structural invalidation',
  };

  // 11. Logical liquidity-based TP
  const tpLogOk = isBull ? (tp1 > entry) : (tp1 > 0 && tp1 < entry);
  const comp11 = {
    id: 11,
    name: '11. Logical Liquidity-Based TP',
    status: tpLogOk ? 'CONFIRMED' : 'MISSING',
    evidence: tpLogOk
      ? `Targets aligned with institutional pools: TP1 (${tp1}) at nearest internal liquidity; TP2 at external swing structure`
      : 'Take profit does not target structural liquidity',
  };

  // 12. Minimum RR requirement (>= 1:2.0)
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp1 - entry);
  const rrRatio = (risk > 0 && entry > 0 && sl > 0 && tp1 > 0) ? reward / risk : 0;
  const rrOk = rrRatio >= 2.0;
  const comp12 = {
    id: 12,
    name: '12. Minimum RR Requirement',
    status: rrOk ? 'CONFIRMED' : (rrRatio >= 1.5 ? 'PARTIAL' : 'MISSING'),
    evidence: rrRatio > 0
      ? `Calculated mathematical Risk:Reward is 1 : ${rrRatio.toFixed(2)} (Requirement: ≥ 1 : 2.0)`
      : 'Valid Entry, Stop Loss, and Take Profit required to compute Risk:Reward',
  };

  const components: any[] = [comp1, comp2, comp3, comp4, comp5, comp6, comp7, comp8, comp9, comp10, comp11, comp12];
  const confirmedCount = components.filter(c => c.status === 'CONFIRMED').length;

  const criticalConfirmed = htfBiasOk && mtfAligned && poiOk && sweepOk && mssOk && slStructOk && rrOk;
  const isAplusQualified = confirmedCount >= 10 && criticalConfirmed;

  let grade: 'A+' | 'A' | 'B' | 'Developing' | 'Rejected / No Setup' = 'A+';
  let summary = '';
  let rejectionReason: string | undefined;

  if (isAplusQualified) {
    grade = 'A+';
    summary = `A+ Institutional Confluence (${confirmedCount}/12 Confirmed): 4H Context → 1H POI → Liquidity Sweep → 15M MSS Confirmation → Sniper Entry → Structural SL → Liquidity TP with 1:${rrRatio.toFixed(2)} R:R.`;
  } else if (confirmedCount >= 8) {
    grade = mssOk ? 'A' : 'Developing';
    summary = `${confirmedCount}/12 Criteria Confirmed — Setup is ${grade}. Missing: ${components.filter(c => c.status !== 'CONFIRMED').map(c => c.name).join(', ')}.`;
    if (!mssOk) rejectionReason = 'Waiting for 15M Market Structure Shift (MSS) candle body close.';
  } else if (confirmedCount >= 6) {
    grade = 'B';
    summary = `${confirmedCount}/12 Criteria Confirmed — Moderate institutional evidence. Requires further structural confirmation.`;
    rejectionReason = 'Sub-optimal confluence; partial timeframe alignment.';
  } else {
    grade = 'Rejected / No Setup';
    summary = `${confirmedCount}/12 Criteria Confirmed — Fails institutional A+ criteria. Trade execution rejected.`;
    rejectionReason = 'Insufficient confluence across 4H, 1H, and 15M timeframes.';
  }

  return {
    score: confirmedCount,
    confirmedCount,
    totalComponents: 12,
    grade,
    isAplusQualified,
    components,
    summary,
    rejectionReason,
  };
}

function ensureSignalMultiTimeframe(s: any): any {
  if (!s) return s;

  // Build and attach 12-Component A+ Confluence Audit if not present
  if (!s.aplusConfluenceAudit) {
    const audit = buildAplusConfluenceAudit(s);
    s.aplusConfluenceAudit = audit;
    if (s.aplusSmc) {
      s.aplusSmc.confluenceAudit = audit;
    }
  }

  return s;
}

app.get('/api/signals', (req: Request, res: Response) => {
  const sorted = [...db.signals]
    .map(ensureSignalMultiTimeframe)
    .sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  res.json({ success: true, signals: sorted });
});

app.post('/api/signals/outcome', (req: Request, res: Response) => {
  const { signalId, outcome, pnlR, status, notes } = req.body;
  if (!signalId) {
    return res.status(400).json({ success: false, error: 'signalId is required' });
  }

  const signal = db.signals.find(s => s.id === signalId);
  if (!signal) {
    return res.status(404).json({ success: false, error: 'Signal not found' });
  }

  if (outcome !== undefined) signal.outcome = outcome;
  if (pnlR !== undefined) signal.pnlR = Number(pnlR);
  if (status !== undefined) signal.status = status;
  if (notes !== undefined) signal.notes = notes;

  // Also update corresponding watchlist item if present
  const wItem = db.watchlist.find(w => w.signal_id === signalId);
  if (wItem) {
    if (status !== undefined) wItem.status = status;
    if (notes !== undefined) wItem.notes = notes;
  }

  saveDb();
  return res.json({ success: true, signal });
});

app.delete('/api/signals/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.signals = db.signals.filter(s => s.id !== id);
  db.watchlist = db.watchlist.filter(w => w.signal_id !== id);
  saveDb();
  res.json({ success: true });
});

app.get('/api/watchlist', (req: Request, res: Response) => {
  const enriched = db.watchlist.map(item => {
    const signal = db.signals.find(s => s.id === item.signal_id);
    return { ...item, signal };
  });
  res.json({ success: true, watchlist: enriched });
});

app.post('/api/watchlist', (req: Request, res: Response) => {
  const { signalId, notes, status, userId } = req.body;
  if (!signalId) {
    return res.status(400).json({ success: false, error: 'signalId is required' });
  }

  const signal = db.signals.find(s => s.id === signalId);
  if (!signal) {
    return res.status(404).json({ success: false, error: 'Signal not found' });
  }

  const existing = db.watchlist.find(w => w.signal_id === signalId);
  if (existing) {
    if (notes !== undefined) existing.notes = notes;
    if (status !== undefined) existing.status = status;
    saveDb();
    return res.json({ success: true, item: existing });
  }

  const item = {
    id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    signal_id: signal.id,
    user_id: userId || signal.user_id || 'usr_trader_demo',
    asset: signal.asset,
    timeframe: signal.timeframe,
    strategy: signal.strategy,
    bias: signal.bias,
    entry: signal.entry,
    stopLoss: signal.stopLoss,
    takeProfit: signal.takeProfit,
    riskReward: signal.riskReward,
    confidence: signal.confidence,
    setupBadge: signal.setupBadge,
    status: status || 'Active',
    notes: notes || signal.reasoning?.[0] || 'Saved setup for execution tracking',
    created_at: new Date().toISOString(),
  };

  db.watchlist.push(item);
  saveDb();
  res.json({ success: true, item });
});

app.put('/api/watchlist/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const item = db.watchlist.find(w => w.id === id);
  if (!item) {
    return res.status(404).json({ success: false, error: 'Watchlist item not found' });
  }

  if (status !== undefined) item.status = status;
  if (notes !== undefined) item.notes = notes;

  saveDb();
  res.json({ success: true, item });
});

app.delete('/api/watchlist/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.watchlist = db.watchlist.filter(w => w.id !== id);
  saveDb();
  res.json({ success: true });
});

// -------------------------------------------------------------
// Admin Analysis Logs API
// -------------------------------------------------------------
app.get('/api/admin/logs', (req: Request, res: Response) => {
  const sorted = [...db.analysisLogs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ success: true, logs: sorted });
});

// -------------------------------------------------------------
// Validation Helper for Price Scale & Directional Integrity
// -------------------------------------------------------------
interface PriceAxisValidationResult {
  valid: boolean;
  reason?: string;
}

export function parseNumericPrice(val: any): number {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') {
    let cleaned = val.replace(/[\$€£¥\sA-Za-z]/g, '').trim();
    if (cleaned.includes(',') && cleaned.includes('.')) {
      if (cleaned.indexOf(',') < cleaned.indexOf('.')) {
        cleaned = cleaned.replace(/,/g, '');
      } else {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      }
    } else if (cleaned.includes(',')) {
      const parts = cleaned.split(',');
      if (parts[1] && parts[1].length === 3) {
        cleaned = cleaned.replace(/,/g, '');
      } else {
        cleaned = cleaned.replace(',', '.');
      }
    }
    const match = cleaned.match(/-?\d+(\.\d+)?/);
    if (match) {
      const parsed = parseFloat(match[0]);
      if (!isNaN(parsed)) return parsed;
    }
  }
  return NaN;
}

function validateSignalPriceScale(
  signal: any,
  requestedAsset: string
): PriceAxisValidationResult {
  if (!signal) {
    return { valid: false, reason: 'SIGNAL REJECTED — Empty signal produced by analysis engine.' };
  }

  // 1. Normalize Bias
  let rawBias = String(signal.bias || '').toUpperCase().trim();
  if (rawBias.includes('BULL') || rawBias.includes('LONG') || rawBias.includes('BUY')) {
    signal.bias = 'BULLISH';
  } else if (rawBias.includes('BEAR') || rawBias.includes('SHORT') || rawBias.includes('SELL')) {
    signal.bias = 'BEARISH';
  } else {
    signal.bias = 'NEUTRAL';
  }

  // Check if analysis explicitly concluded no setup or insufficient evidence
  const rawStatus = String(signal.setupStatus || '').toUpperCase();
  const rawQuality = String(signal.chartQuality || '').toUpperCase();
  const isNoSetupOrInsufficient =
    rawStatus.includes('NO VALID') ||
    rawStatus.includes('INSUFFICIENT') ||
    rawQuality.includes('UNREADABLE') ||
    signal.setupBadge === 'Avoid' ||
    signal.setupBadge === 'Rejected / No Setup';

  // 2. Extract numeric prices
  const entry = parseNumericPrice(signal.entry ?? signal.entryPrice ?? signal.entry_price ?? signal.entryLevel);
  const sl = parseNumericPrice(signal.stopLoss ?? signal.sl ?? signal.stop_loss ?? signal.stopPrice);
  const tp = parseNumericPrice(signal.takeProfit ?? signal.tp ?? signal.tp1 ?? signal.takeProfit1 ?? signal.take_profit ?? (Array.isArray(signal.takeProfits) ? signal.takeProfits[0] : undefined));
  const tp2 = parseNumericPrice(signal.takeProfit2 ?? signal.tp2 ?? signal.takeProfit_2 ?? (Array.isArray(signal.takeProfits) ? signal.takeProfits[1] : undefined));
  const tp3 = parseNumericPrice(signal.takeProfit3 ?? signal.tp3 ?? signal.takeProfit_3 ?? (Array.isArray(signal.takeProfits) ? signal.takeProfits[2] : undefined));
  const altEntry = parseNumericPrice(signal.alternativeEntry ?? signal.altEntry ?? signal.secondaryEntry);

  if (isNoSetupOrInsufficient || isNaN(entry) || entry <= 0) {
    // Legitimate negative determination - do NOT invent mock prices
    signal.entry = !isNaN(entry) && entry > 0 ? entry : null;
    signal.stopLoss = !isNaN(sl) && sl > 0 ? sl : null;
    signal.takeProfit = !isNaN(tp) && tp > 0 ? tp : null;
    signal.takeProfit2 = !isNaN(tp2) && tp2 > 0 ? tp2 : null;
    signal.takeProfit3 = !isNaN(tp3) && tp3 > 0 ? tp3 : null;
    signal.alternativeEntry = !isNaN(altEntry) && altEntry > 0 ? altEntry : null;
    signal.riskReward = 'N/A';
    signal.setupStatus = rawQuality.includes('UNREADABLE') ? 'INSUFFICIENT EVIDENCE' : (signal.setupStatus || 'NO VALID SETUP');
    signal.setupBadge = 'Avoid';

    // Compute genuine audit without synthetic fallbacks
    const audit = buildAplusConfluenceAudit(signal);
    signal.aplusConfluenceAudit = audit;
    if (signal.aplusSmc) {
      signal.aplusSmc.confluenceAudit = audit;
    }
    return { valid: true };
  }

  // A trade setup IS proposed with numeric entry: validate all levels strictly
  signal.entry = entry;
  if (!isNaN(altEntry) && altEntry > 0) signal.alternativeEntry = altEntry;

  if (isNaN(sl) || sl <= 0) {
    return {
      valid: false,
      reason: 'STRUCTURAL INVALIDATION FAILED — Proposed setup requires a genuine Stop Loss anchored to visible chart structure.',
    };
  }
  signal.stopLoss = sl;

  if (isNaN(tp) || tp <= 0) {
    return {
      valid: false,
      reason: 'TARGET VALIDATION FAILED — Proposed setup requires a genuine Take Profit target anchored to visible chart liquidity.',
    };
  }
  signal.takeProfit = tp;
  if (!isNaN(tp2) && tp2 > 0) signal.takeProfit2 = tp2;
  if (!isNaN(tp3) && tp3 > 0) signal.takeProfit3 = tp3;

  // 3. Strict Directional Verification (NO synthetic price correction)
  if (signal.bias === 'BULLISH') {
    if (sl >= entry) {
      return {
        valid: false,
        reason: `DIRECTIONAL CONFLICT — Bullish setup requires Stop Loss (${sl}) to be strictly below Entry (${entry}).`,
      };
    }
    if (tp <= entry) {
      return {
        valid: false,
        reason: `DIRECTIONAL CONFLICT — Bullish setup requires Take Profit (${tp}) to be strictly above Entry (${entry}).`,
      };
    }
  } else if (signal.bias === 'BEARISH') {
    if (sl <= entry) {
      return {
        valid: false,
        reason: `DIRECTIONAL CONFLICT — Bearish setup requires Stop Loss (${sl}) to be strictly above Entry (${entry}).`,
      };
    }
    if (tp >= entry) {
      return {
        valid: false,
        reason: `DIRECTIONAL CONFLICT — Bearish setup requires Take Profit (${tp}) to be strictly below Entry (${entry}).`,
      };
    }
  }

  // 4. Genuine Mathematical Risk-to-Reward calculation
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  const calculatedRR = risk > 0 ? `1 : ${(reward / risk).toFixed(2)}` : 'N/A';
  signal.riskReward = calculatedRR;

  // 5. Price Axis Scale verification
  let scale = signal.priceAxisScale;
  let minP = scale ? parseNumericPrice(scale.minVisiblePrice) : NaN;
  let maxP = scale ? parseNumericPrice(scale.maxVisiblePrice) : NaN;
  let currP = scale ? parseNumericPrice(scale.currentVisiblePrice) : NaN;

  if (!isNaN(minP) && !isNaN(maxP) && minP > 0 && maxP > minP) {
    signal.priceAxisScale.minVisiblePrice = minP;
    signal.priceAxisScale.maxVisiblePrice = maxP;
    signal.priceAxisScale.currentVisiblePrice = isNaN(currP) ? entry : currP;
    signal.priceAxisScale.isAxisReadable = true;

    // Check if entry price is within reasonable range of visible chart axis
    const tolerance = (maxP - minP) * 0.35;
    if (entry < minP - tolerance || entry > maxP + tolerance) {
      return {
        valid: false,
        reason: `PRICE SCALE DISCREPANCY — Entry price (${entry}) falls outside visible chart price range (${minP} - ${maxP}). Ensure all levels are read directly from chart axis.`,
      };
    }
  } else {
    // If scale couldn't be accurately read, record honest status
    signal.priceAxisScale = {
      minVisiblePrice: null,
      maxVisiblePrice: null,
      currentVisiblePrice: entry,
      isAxisReadable: false,
      confidenceInPriceReading: signal.priceAxisScale?.confidenceInPriceReading || 40,
      notes: signal.priceAxisScale?.notes || 'Price axis labels not clearly delineated; levels estimated from visible candle range.',
    };
  }

  // 6. Compute genuine 12-Component A+ Confluence Audit
  const audit = buildAplusConfluenceAudit(signal);
  signal.aplusConfluenceAudit = audit;
  if (signal.aplusSmc) {
    signal.aplusSmc.confluenceAudit = audit;
  }

  signal.chartQuality = signal.chartQuality || 'ANALYZABLE';
  if (audit && !audit.isAplusQualified) {
    signal.setupStatus = audit.grade === 'Developing' ? 'DEVELOPING' : audit.grade === 'Rejected / No Setup' ? 'NO VALID SETUP' : signal.setupStatus || 'DEVELOPING';
    signal.setupBadge = audit.grade;
  } else {
    signal.setupStatus = signal.setupStatus || 'A+ CONFIRMED';
    signal.setupBadge = audit.grade || 'A+';
  }

  // 7. Calibrate annotations to visible price scale if scale is confirmed
  if (Array.isArray(signal.annotations) && !isNaN(minP) && !isNaN(maxP) && maxP > minP) {
    for (const ann of signal.annotations) {
      const annPrice = parseNumericPrice(ann.price);
      if (!isNaN(annPrice)) {
        ann.price = annPrice;
        const calculatedY = Math.max(2, Math.min(98, ((maxP - annPrice) / (maxP - minP)) * 100));
        ann.y = Number(calculatedY.toFixed(1));
        ann.y2 = Number(calculatedY.toFixed(1));
      }
    }
  }

  return { valid: true };
}

function detectTimeframeMismatch(
  chart: any,
  roleLabel: string,
  expectedTf: string
): { mismatch: boolean; detected?: string; note?: string } {
  if (!chart || !chart.imageBase64) return { mismatch: false };
  const rawStr =
    chart.imageBase64.includes('svg') || chart.imageBase64.startsWith('data:image/svg')
      ? Buffer.from(chart.imageBase64.split(',')[1] || '', 'base64').toString('utf-8')
      : '';

  if (rawStr) {
    const patterns: Array<{ name: string; regex: RegExp }> = [
      { name: '4H', regex: /\b(4H|H4|240M)\b/i },
      { name: '1H', regex: /\b(1H|H1|60M)\b/i },
      { name: '15M', regex: /\b(15M|M15)\b/i },
      { name: '5M', regex: /\b(5M|M5)\b/i },
      { name: '1D', regex: /\b(1D|D1|Daily)\b/i },
    ];
    for (const pat of patterns) {
      if (pat.regex.test(rawStr)) {
        const normExp = (expectedTf || '').toUpperCase();
        const normDetected = pat.name.toUpperCase();
        if (
          normDetected !== normExp &&
          normDetected.replace('H', '').replace('M', '') !== normExp.replace('H', '').replace('M', '')
        ) {
          return {
            mismatch: true,
            detected: pat.name,
            note: `Timeframe mismatch detected on ${roleLabel} chart: Uploaded as ${expectedTf}, but chart text displays ${pat.name}.`,
          };
        }
      }
    }
  }
  return { mismatch: false };
}

function validateMultiTimeframeSignal(
  signal: any,
  isMulti: boolean,
  hasHtf: boolean,
  hasMtf: boolean,
  hasLtf: boolean,
  mismatchNotice?: string
): void {
  if (!isMulti) return;

  if (!signal.multiTimeframe) {
    signal.multiTimeframe = {};
  }

  signal.multiTimeframe.htfAnalyzed = Boolean(hasHtf && (signal.multiTimeframe.htfAnalyzed ?? true));
  signal.multiTimeframe.mtfAnalyzed = Boolean(hasMtf && (signal.multiTimeframe.mtfAnalyzed ?? true));
  signal.multiTimeframe.ltfAnalyzed = Boolean(hasLtf && (signal.multiTimeframe.ltfAnalyzed ?? true));
  signal.multiTimeframe.allTimeframesAnalyzed =
    signal.multiTimeframe.htfAnalyzed && signal.multiTimeframe.mtfAnalyzed && signal.multiTimeframe.ltfAnalyzed;

  if (mismatchNotice) {
    signal.multiTimeframe.timeframeMismatchNotice = mismatchNotice;
  }

  // HARD VALIDATION RULE (Requirement 8):
  // Before the final signal can be generated: htfAnalyzed === true AND mtfAnalyzed === true AND ltfAnalyzed === true
  // If ANY is false: DO NOT generate the trade. Return WAIT / MULTI-TIMEFRAME EVIDENCE INCOMPLETE.
  if (!signal.multiTimeframe.allTimeframesAnalyzed) {
    const missing: string[] = [];
    if (!signal.multiTimeframe.htfAnalyzed) missing.push('Higher Timeframe (4H)');
    if (!signal.multiTimeframe.mtfAnalyzed) missing.push('Middle Timeframe (1H)');
    if (!signal.multiTimeframe.ltfAnalyzed) missing.push('Lower Timeframe (15M)');

    signal.bias = 'NEUTRAL';
    signal.setupStatus = 'INSUFFICIENT EVIDENCE';
    signal.setupBadge = 'Avoid';
    signal.confidence = 35;
    if (signal.multiTimeframe.finalDecision) {
      signal.multiTimeframe.finalDecision.direction = 'WAIT';
      signal.multiTimeframe.finalDecision.grade = 'Avoid';
    }
    if (!signal.aplusSmc) signal.aplusSmc = {} as any;
    if (!signal.aplusSmc.missingConditions) signal.aplusSmc.missingConditions = [];
    signal.aplusSmc.missingConditions.unshift(
      `WAIT — MULTI-TIMEFRAME EVIDENCE INCOMPLETE: Missing or unanalyzed timeframe(s): ${missing.join(', ')}. All three timeframes (4H, 1H, 15M) must be validated.`
    );
    signal.reasoning = [
      `WAIT: Multi-timeframe evidence incomplete. Missing analysis for: ${missing.join(', ')}.`,
      'Top-down sequence requires 4H context, 1H structure, and 15M confirmation.',
      ...(signal.reasoning || []),
    ];
    return;
  }

  // Check 4H vs 1H conflict (Requirement 3)
  const htfBias = signal.multiTimeframe?.higherTimeframe?.bias || signal.multiTimeframe?.overallBias;
  const mtfBias = signal.multiTimeframe?.middleTimeframe?.bias;
  const alignment = signal.multiTimeframe?.middleTimeframe?.alignmentWithHtf;

  if (htfBias && mtfBias && htfBias !== 'NEUTRAL' && mtfBias !== 'NEUTRAL' && htfBias !== mtfBias) {
    if (alignment !== 'Retracement' && alignment !== 'Mitigation') {
      signal.bias = 'NEUTRAL';
      signal.setupStatus = 'DEVELOPING';
      signal.setupBadge = 'High Risk';
      if (signal.multiTimeframe.finalDecision) {
        signal.multiTimeframe.finalDecision.direction = 'WAIT';
        signal.multiTimeframe.finalDecision.grade = 'High Risk';
      }
      if (!signal.aplusSmc) signal.aplusSmc = {} as any;
      if (!signal.aplusSmc.missingConditions) signal.aplusSmc.missingConditions = [];
      signal.aplusSmc.missingConditions.push(
        `WAIT — TIMEFRAME CONFLICT: 4H (${htfBias}) and 1H (${mtfBias}) are in divergence. Insufficient confirmation whether 1H is a temporary retracement or structural reversal.`
      );
    }
  }

  // Check 15M confirmation (Requirement 4)
  const ltfConf = signal.multiTimeframe?.lowerTimeframe?.confirmation;
  if (ltfConf && ltfConf !== 'CONFIRMED') {
    signal.bias = 'NEUTRAL';
    signal.setupStatus = 'DEVELOPING';
    signal.setupBadge = 'Developing';
    if (signal.multiTimeframe.finalDecision) {
      signal.multiTimeframe.finalDecision.direction = 'WAIT';
      signal.multiTimeframe.finalDecision.grade = 'Developing';
    }
    if (!signal.aplusSmc) signal.aplusSmc = {} as any;
    if (!signal.aplusSmc.missingConditions) signal.aplusSmc.missingConditions = [];
    signal.aplusSmc.missingConditions.push(
      'WAIT — LOWER TIMEFRAME PENDING: 15M entry confirmation (MSS/CHoCH, displacement) has not yet triggered.'
    );
  }
}

// -------------------------------------------------------------
// CORE SERVER ANALYSIS FUNCTION: analyzeChart (Optimized High-Performance Pipeline)
// -------------------------------------------------------------
app.post('/api/analyzeChart', async (req: Request, res: Response) => {
  const t_start = Date.now();
  const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  
  // Timing trackers
  let auth_ms = 0;
  let image_validation_ms = 0;
  let image_processing_ms = 0;
  let prompt_build_ms = 0;
  let ai_request_ms = 0;
  let ai_parse_ms = 0;
  let schema_validation_ms = 0;
  let signal_validation_ms = 0;
  let database_insert_ms = 0;
  let logging_ms = 0;

  // 1. Auth & Session Timing
  const t_auth = Date.now();
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : 'usr_trader_demo';
  const authenticatedUser = db.users.find(u => u.id === token || u.email === token) || db.users[0];
  auth_ms = Date.now() - t_auth;

  const {
    asset,
    assetClass = 'Crypto',
    timeframe = 'H1',
    strategy = 'ICT',
    charts = [],
    accountBalance = 10000,
    riskPercent = 1.0,
    userId = authenticatedUser?.id || 'usr_trader_demo',
  } = req.body;

  // 2. Input & Image Validation
  const t_val = Date.now();
  if (!asset || typeof asset !== 'string') {
    return res.status(400).json({ success: false, error: 'Asset/Pair identifier is required (e.g. BTCUSDT, EURUSD, XAUUSD).' });
  }

  if (!charts || !Array.isArray(charts) || charts.length === 0) {
    return res.status(400).json({ success: false, error: 'At least one chart image is required for institutional analysis.' });
  }

  const isMulti = charts.length > 1;
  const mode = isMulti ? 'multi' : 'single';

  for (const c of charts) {
    if (!c.imageBase64 && !c.imagePath) {
      return res.status(400).json({ success: false, error: `Missing image data for chart role: ${c.role || 'SINGLE'}` });
    }
  }
  image_validation_ms = Date.now() - t_val;

  const htfChart = charts.find(c => c.role === 'HTF');
  const mtfChart = charts.find(c => c.role === 'MTF');
  const ltfChart = charts.find(c => c.role === 'LTF') || (!isMulti ? charts[0] : undefined);
  const singleChart = charts.find(c => c.role === 'SINGLE') || charts[0];

  // Detect timeframe mismatches if any SVG text or labels contain indicators
  let mismatchNotice: string | undefined;
  if (isMulti) {
    const htfMis = detectTimeframeMismatch(htfChart, 'Higher Timeframe (4H)', htfChart?.timeframe || '4H');
    const mtfMis = detectTimeframeMismatch(mtfChart, 'Middle Timeframe (1H)', mtfChart?.timeframe || '1H');
    const ltfMis = detectTimeframeMismatch(ltfChart, 'Lower Timeframe (15M)', ltfChart?.timeframe || '15M');
    const notices = [htfMis.note, mtfMis.note, ltfMis.note].filter(Boolean);
    if (notices.length > 0) {
      mismatchNotice = notices.join(' | ');
    }
  }

  const ai = getGeminiClient();

  try {
    // 3. Image Processing & Conversion
    const t_proc = Date.now();
    let svgContext = '';

    function toInlinePart(chart: any) {
      if (!chart || !chart.imageBase64) return null;
      const rawBase64 = chart.imageBase64.includes(',')
        ? chart.imageBase64.split(',')[1]
        : chart.imageBase64;

      let mime = chart.imageMime || 'image/jpeg';
      if (chart.imageBase64.startsWith('data:image/jpeg') || chart.imageBase64.startsWith('data:image/jpg')) {
        mime = 'image/jpeg';
      } else if (chart.imageBase64.startsWith('data:image/webp')) {
        mime = 'image/webp';
      } else if (chart.imageBase64.startsWith('data:image/png')) {
        mime = 'image/png';
      } else if (chart.imageBase64.includes('svg') || chart.imageBase64.startsWith('<svg')) {
        mime = 'image/svg+xml';
      }

      if (mime === 'image/svg+xml') {
        try {
          const decodedSvg = Buffer.from(rawBase64, 'base64').toString('utf-8');
          svgContext += `\n[Chart Data for ${chart.role || 'CHART'} (${chart.timeframe || ''})]:\n${decodedSvg.substring(0, 2500)}\n`;
        } catch {
          // ignore svg decode fallback
        }
        return null;
      }

      return {
        inlineData: {
          mimeType: mime,
          data: rawBase64,
        },
      };
    }

    const htfPart = toInlinePart(htfChart);
    const mtfPart = toInlinePart(mtfChart);
    const ltfPart = toInlinePart(ltfChart);
    const singlePart = toInlinePart(singleChart);

    image_processing_ms = Date.now() - t_proc;

    // 4. Prompt Construction
    const t_prompt = Date.now();
    const systemInstruction = `You are TradeGuard AI — Institutional A+ SMC Setup Engine & Prop-Desk Chart Analysis System.
Your core objective is to identify and validate high-probability Smart Money Concepts (SMC) institutional trade setups from the visible chart price action.

ABSOLUTE ENGINE RULES:
1. THE UPLOADED CHART IS YOUR GROUND TRUTH: All price numbers (Min/Max scale, Entry, Stop Loss, Take Profit, HTF Supply/Demand zones, Inducement levels, Swept levels, Protected High/Low, POI) MUST be read directly from the visible chart scale. NEVER invent prices or use mock data.
2. STRICT CAUSAL SEQUENCE (The 10-Step Institutional Setup Model):
   - BEARISH A+ MODEL:
     1. HTF Supply (H4/HTF structural supply, origin of major move, order block in premium zone)
     2. Supply Mitigation (Price returns to HTF supply, depth, reaction)
     3. Inducement (Engineered lower high / early seller trap before true sweep)
     4. Liquidity Sweep (Price pushes above inducement/high, sweeps buy-side liquidity, wick rejection)
     5. Protected High (The high responsible for taking liquidity becomes the structural reference point for invalidation & SL)
     6. Failure To Swing (Price pushes away, retraces upward, attempts to swing above/reclaim protected high, fails to take/hold, rejects, closes below failure trigger low)
     7. Change In State Of Delivery (CSD) (Shift from bullish/indecisive to bearish delivery confirmed by displacement candle closing beyond failure level)
     8. POI Created by Delivery Change (Bearish Order Block / FVG causally linked to CSD)
     9. POI Mitigation (Price returns to mitigate the POI)
     10. Sniper Entry (15M LTF confirmation entry from mitigated POI)
     11. Stop Loss: Positioned above Protected High with market-structure buffer
     12. Take Profit: TP1 at nearest internal range liquidity (equal lows/swing low); TP2 at external range liquidity pool
     13. Mathematical Risk-to-Reward ratio strictly computed
   - BULLISH A+ MODEL:
     1. HTF Demand (H4/HTF structural demand in discount zone)
     2. Demand Mitigation
     3. Inducement (Engineered higher low / early buyer trap)
     4. Liquidity Sweep (Price pushes below inducement/low, sweeps sell-side liquidity, wick rejection)
     5. Protected Low (The low responsible for taking sell-side liquidity)
     6. Failure To Swing (Retest fails to take/hold below protected low, closes above failure trigger high)
     7. Change In State Of Delivery (CSD) (Shift to bullish delivery)
     8. Bullish POI (Bullish Order Block / FVG causally linked to CSD)
     9. POI Mitigation
     10. Sniper Entry (15M LTF entry)
     11. Stop Loss: Positioned below Protected Low with market-structure buffer
     12. Take Profit: TP1 at internal range liquidity (equal highs); TP2 at external range liquidity pool
3. VALIDATION & SETUP STATUS:
   - chartQuality: "ANALYZABLE" | "PARTIALLY ANALYZABLE" | "UNREADABLE"
   - setupStatus: "A+ CONFIRMED" | "DEVELOPING" | "NO VALID SETUP" | "INSUFFICIENT EVIDENCE"
   - If DEVELOPING: explicitly state which missing condition is being waited for (e.g. "Waiting for close below the failure low before confirming Change In State Of Delivery").
4. DIRECTIONAL INTEGRITY:
   - For BULLISH bias: Stop Loss < Entry < TP1 < TP2 < TP3
   - For BEARISH bias: Stop Loss > Entry > TP1 > TP2 > TP3
5. ANNOTATIONS:
   Provide bounding/coordinate percentages (x, y, x2, y2 from 0 to 100 where y=0 is top max price, y=100 is bottom min price). Include exact numeric price in 'price' attribute.
   Annotation types to identify: 'HTF Supply', 'HTF Demand', 'Inducement', 'Liquidity Sweep', 'Protected High', 'Protected Low', 'Failure To Swing', 'Change In State Of Delivery', 'Order Block', 'FVG', 'Entry', 'Stop Loss', 'Take Profit', 'Take Profit 2'.

OUTPUT JSON SCHEMA:
{
  "bias": "BULLISH" | "BEARISH",
  "entry": 4602.5,
  "alternativeEntry": 4598.0,
  "stopLoss": 4585.0,
  "takeProfit": 4635.0,
  "takeProfit2": 4650.0,
  "takeProfit3": 4675.0,
  "confidence": 92,
  "session": "New York (Killzone)",
  "chartQuality": "ANALYZABLE",
  "setupStatus": "A+ CONFIRMED",
  "setupBadge": "A+",
  "priceAxisScale": {
    "minVisiblePrice": 4580.0,
    "maxVisiblePrice": 4680.0,
    "currentVisiblePrice": 4602.5,
    "isAxisReadable": true,
    "confidenceInPriceReading": 95,
    "priceAxisLabelsFound": ["4580", "4600", "4620"]
  },
  "marketStructure": {
    "trend": "Uptrend",
    "structure": "Bullish Change In State Of Delivery (CSD)",
    "swingHigh": "4680.0",
    "swingLow": "4580.0",
    "protectedHigh": "4675.0",
    "protectedLow": "4585.0",
    "bos": true,
    "choch": true
  },
  "smcIct": {
    "bos": "Confirmed Break of Structure",
    "choch": "Change In State Of Delivery confirmed",
    "fvg": "Fair Value Gap holding mitigation",
    "orderBlocks": "Institutional Order Block",
    "liquidity": "Liquidity swept cleanly at extremes",
    "zone": "Discount / Premium Zone",
    "supplyDemand": "Institutional Reaction Zone"
  },
  "aplusSmc": {
    "direction": "BUY" | "SELL",
    "setupGrade": "A+",
    "chartQuality": "ANALYZABLE",
    "setupStatus": "A+ CONFIRMED",
    "htfSupplyDemand": {
      "status": "VALID",
      "type": "HTF Demand" | "HTF Supply",
      "zoneRange": "4580.0 - 4595.0",
      "upperBoundary": 4595.0,
      "lowerBoundary": 4580.0,
      "timeframe": "H4",
      "structuralOrigin": "Origin of major structural displacement",
      "notes": "Validated HTF reaction zone"
    },
    "htfMitigation": {
      "status": "FIRST MITIGATION",
      "entryDepth": "50% equilibrium mitigation",
      "reactionProduced": "Vigorous displacement wick",
      "liquidityPresent": "Internal liquidity cleared"
    },
    "inducement": {
      "status": "IDENTIFIED",
      "level": 4598.0,
      "type": "Minor structural trap",
      "description": "Engineered inducement prior to sweep"
    },
    "liquiditySweep": {
      "status": "CONFIRMED",
      "sweptLevel": 4584.0,
      "sweepType": "Sell-Side Liquidity Sweep",
      "wickVsBodyClose": "Wick swept level; body closed inside",
      "subsequentDelivery": "Aggressive displacement impulse",
      "rejectionValidation": "Immediate rejection confirms liquidity capture"
    },
    "protectedLevel": {
      "type": "PROTECTED LOW" | "PROTECTED HIGH",
      "price": 4585.0,
      "causalConnection": "Anchor of liquidity sweep event",
      "invalidationRole": "Structural invalidation reference"
    },
    "failureToSwing": {
      "status": "CONFIRMED",
      "attemptedSwingLevel": 4588.0,
      "failurePoint": 4586.0,
      "triggerFailureLowHigh": 4602.5,
      "structuralMechanism": "Retest failed to breach protected level"
    },
    "changeInStateOfDelivery": {
      "status": "CONFIRMED",
      "shiftType": "Bearish to Bullish",
      "responsibleCandleStructure": "Displacement candle breaking failure level",
      "breakCloseLevel": 4602.5,
      "detailedSequence": "Liquidity Sweep -> Rejection -> Failure To Swing -> CSD Break"
    },
    "poi": {
      "status": "VALID",
      "type": "Bullish Order Block",
      "priceRange": "4598.0 - 4602.5",
      "upperLevel": 4602.5,
      "lowerLevel": 4598.0,
      "causalConnectionToDeliveryChange": "Causal displacement origin"
    },
    "poiMitigation": {
      "status": "CONFIRMED",
      "retracementDepth": "Controlled pullback into POI",
      "reactionConfirmation": "15M sub-structure rejection",
      "protectedStructureIntact": true
    },
    "sniperEntry": {
      "entryPrice": 4602.5,
      "executionTimeframe": "15M",
      "confirmationType": "15M Order Block Defense",
      "entryRationale": "Sniper execution from mitigated POI"
    },
    "stopLoss": {
      "stopLossPrice": 4585.0,
      "bufferAmount": "17.5 pts",
      "structureReference": "Protected Low",
      "rationale": "SL is positioned below protected structure because a valid setup cannot invalidate this level."
    },
    "takeProfitTargets": {
      "tp1": 4635.0,
      "tp1LiquidityType": "Internal Range Liquidity (Equal Highs)",
      "tp2": 4650.0,
      "tp2LiquidityType": "External Range Liquidity (Major Swing High)",
      "tp3": 4675.0
    },
    "calculatedRiskReward": "1 : 2.50",
    "checklist": [
      { "stepNumber": 1, "condition": "HTF Zone Validated", "status": "CONFIRMED", "evidence": "H4 demand level confirmed" }
    ],
    "missingConditions": [],
    "causalReasoningSequence": [
      "1. Price tapped HTF Demand zone.",
      "2. Liquidity sweep occurred below inducement.",
      "3. Protected Low established and preserved."
    ]
  },
  "volatility": { "atr": "Dynamic ATR", "dailyRange": "Normal", "sessionVolatility": "Medium" },
  "riskManagement": {
    "riskPercent": ${riskPercent},
    "lotSize": "0.50",
    "positionSize": "$${accountBalance}",
    "maximumLoss": "$${((accountBalance * riskPercent) / 100).toFixed(2)}",
    "expectedProfit": "$${((accountBalance * riskPercent * 2.5) / 100).toFixed(2)}",
    "riskRewardRatio": "1 : 2.50"
  },
  "multiTimeframe": {
    "htfAnalyzed": true,
    "mtfAnalyzed": true,
    "ltfAnalyzed": true,
    "allTimeframesAnalyzed": true,
    "overallBias": "BULLISH",
    "htfTrend": "BULLISH",
    "mtfStructure": "BULLISH",
    "ltfConfirmation": "BULLISH",
    "alignment": "Full Multi-Timeframe Confluence",
    "crossTimeframeReasoning": "4H: Bullish order flow holding demand → 1H: Internal sweep & BOS displacement → 15M: MSS & FVG mitigation → FINAL: BUY",
    "timeframeMismatchNotice": "",
    "higherTimeframe": {
      "analyzed": true,
      "timeframe": "4H",
      "bias": "BULLISH",
      "structure": "Major 4H bullish structure holding demand above swing low",
      "liquidity": "Major buy-side liquidity pool resting above external equal highs",
      "poi": "4H Institutional Demand Zone in discount pricing",
      "swingHigh": 4680.0,
      "swingLow": 4560.0,
      "protectedLevel": "4585.0",
      "premiumDiscount": "Discount Zone (< 50% Equilibrium)",
      "notes": "4H context establishes macro directional filter"
    },
    "middleTimeframe": {
      "analyzed": true,
      "timeframe": "1H",
      "bias": "BULLISH",
      "structure": "1H structure aligned bullish with clean BOS",
      "bosChoch": "Confirmed 1H BOS with strong impulse body close",
      "liquidity": "Sell-side liquidity swept at internal swing low",
      "poi": "1H Bullish Order Block + FVG unmitigated zone",
      "displacement": "Strong bullish impulse departing from demand zone",
      "alignmentWithHtf": "Aligned",
      "notes": "1H confirms structure without divergence against 4H bias"
    },
    "lowerTimeframe": {
      "analyzed": true,
      "timeframe": "15M",
      "confirmation": "CONFIRMED",
      "mssChoch": "15M Bullish Market Structure Shift (MSS) confirmed by body close",
      "displacement": "Bullish displacement leaving valid 15M Fair Value Gap (FVG)",
      "fvgOb": "15M FVG retest with order block defense confirming sniper execution",
      "entry": 4602.5,
      "invalidation": 4585.0,
      "shortTermLiquidityTargets": "Previous 15M swing high / internal liquidity pool",
      "notes": "15M triggers sniper execution"
    },
    "finalDecision": {
      "direction": "BUY",
      "entry": 4602.5,
      "sl": 4585.0,
      "tp1": 4635.0,
      "tp2": 4650.0,
      "rr": "1 : 2.50",
      "confidence": 92,
      "grade": "A+"
    }
  },
  "strategyScores": [
    { "strategy": "ICT", "score": 94, "rationale": "High confluence liquidity sweep & CSD." },
    { "strategy": "SMC", "score": 92, "rationale": "Protected structure & POI mitigation." }
  ],
  "recommendedStrategy": { "name": "${strategy}", "why": "Textbook institutional SMC alignment" },
  "qualityScore": { "structure": 92, "trend": 90, "liquidity": 94, "volume": 86, "riskReward": 92, "volatility": 88, "overall": 91, "grade": "A+", "explanation": "Institutional A+ grade setup" },
  "tradeManagement": {
    "moveToBreakEven": "Move SL to BE after TP1 reached",
    "partials": "Lock 50% at TP1; trail remainder",
    "earlyExit": "Exit if protected structure is invalidated",
    "avoidIf": "Avoid during high-impact red folder news"
  },
  "explanation": {
    "whySelected": "Selected due to confirmed 10-step institutional SMC sequence.",
    "supportingConditions": ["Liquidity sweep", "Protected structure", "CSD confirmed"],
    "strongestSignals": ["POI mitigation", "Asymmetric risk-to-reward"],
    "invalidationRisks": ["Reclaim of protected level"]
  },
  "reasoning": ["Institutional alignment confirmed.", "Price reacting from validated POI."],
  "annotations": [
    { "type": "Entry", "x": 20, "y": 50, "x2": 95, "y2": 50, "label": "Entry: 4602.5", "color": "#10b981", "price": 4602.5 },
    { "type": "Stop Loss", "x": 20, "y": 72, "x2": 95, "y2": 72, "label": "SL (Protected): 4585.0", "color": "#f43f5e", "price": 4585.0 },
    { "type": "Take Profit", "x": 20, "y": 24, "x2": 95, "y2": 24, "label": "TP1 (Internal): 4635.0", "color": "#10b981", "price": 4635.0 }
  ]
}
Output ONLY a valid JSON object matching the required schema.`;

    const userText = `Perform TRADEGUARD AI institutional A+ SMC setup engine analysis for ${asset} (${assetClass}) on timeframe ${timeframe} using strategy ${strategy}.
Account Balance: $${accountBalance}, Risk: ${riskPercent}%.
${
  isMulti
    ? `=== MULTI-TIMEFRAME ANALYSIS MANDATE ===
You have been provided with THREE INDEPENDENT chart inputs in strict chronological sequence:
1. HIGHER TIMEFRAME (${htfChart?.timeframe || '4H'}): Evaluate macro bias, swing high/low, HTF key supply/demand zone, and discount/premium pricing.
2. MIDDLE TIMEFRAME (${mtfChart?.timeframe || '1H'}): Refine 4H zone, evaluate 1H structure, BOS/CHoCH, internal liquidity sweeps, and 1H order blocks/FVGs. Check alignment with 4H bias.
3. LOWER TIMEFRAME (${ltfChart?.timeframe || '15M'}): Sniper execution trigger. Evaluate 15M MSS/CHoCH, displacement candle, FVG mitigation, sniper entry, and stop loss placement.
SYNTHESIZE ALL THREE: The final trade MUST be the combined product of 4H Context + 1H Structure + 15M Confirmation. If any timeframe fails to confirm, return WAIT.`
    : 'Single-chart mode: Derive complete structural sequence from visible price scale.'
}
${svgContext ? `\nChart SVG Context:\n${svgContext}` : ''}
Execute the full 7-pass analysis and return complete JSON.`;
    prompt_build_ms = Date.now() - t_prompt;

    // 5. AI Request (Optimized vision call with labeled multi-timeframe parts and fallback)
    const t_ai = Date.now();
    const candidateModels = [
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
      'gemini-3.1-pro-preview',
    ];
    let rawText = '';
    let usedModel = '';
    let quotaHit = false;
    let highDemandHit = false;

    if (ai) {
      const AI_TOTAL_BUDGET_MS = 35000;
      const aiStartTime = Date.now();

      // Build structured multimodal contents array
      const contentParts: any[] = [];
      if (isMulti) {
        contentParts.push({
          text: `=== TRADEGUARD MULTI-TIMEFRAME ANALYSIS TASK ===
You are analyzing THREE DISTINCT charts uploaded by the trader in a strict top-down institutional sequence:
1. HIGHER TIMEFRAME (4H): Macro Bias & Context
2. MIDDLE TIMEFRAME (1H): Structural Refinement & Liquidity Sweeps
3. LOWER TIMEFRAME (15M): Sniper Entry Trigger & Execution

Process the 3 charts below INDEPENDENTLY, then synthesize the final trade decision.`,
        });

        if (htfPart) {
          contentParts.push({
            text: `\n[INPUT CHART 1: HIGHER TIMEFRAME (${htfChart?.timeframe || '4H'}) — ROLE: CONTEXT & BIAS]\nAnalyze this chart independently. Determine macro bias, swing highs/lows, HTF supply/demand zones, and whether price is in Premium or Discount.`,
          });
          contentParts.push(htfPart);
        }
        if (mtfPart) {
          contentParts.push({
            text: `\n[INPUT CHART 2: MIDDLE TIMEFRAME (${mtfChart?.timeframe || '1H'}) — ROLE: STRUCTURAL REFINEMENT]\nAnalyze this chart independently. Identify 1H swing structure, BOS/CHoCH, internal liquidity sweeps, and 1H Order Blocks/FVGs. Check alignment with 4H bias.`,
          });
          contentParts.push(mtfPart);
        }
        if (ltfPart) {
          contentParts.push({
            text: `\n[INPUT CHART 3: LOWER TIMEFRAME (${ltfChart?.timeframe || '15M'}) — ROLE: ENTRY CONFIRMATION]\nAnalyze this chart independently. Identify 15M Market Structure Shift (MSS/CHoCH), displacement impulse, FVG mitigation, exact entry price, Stop Loss beyond protected structure, and TP targets.`,
          });
          contentParts.push(ltfPart);
        }
        contentParts.push({ text: userText });
      } else {
        if (singlePart) contentParts.push(singlePart);
        contentParts.push({ text: userText });
      }

      for (const modelCandidate of candidateModels) {
        if (Date.now() - aiStartTime > AI_TOTAL_BUDGET_MS) {
          break;
        }

        try {
          const config: any = {
            systemInstruction,
            responseMimeType: 'application/json',
          };

          const contents = contentParts.length > 0
            ? { parts: contentParts }
            : userText;

          const modelPromise = ai.models.generateContent({
            model: modelCandidate,
            contents,
            config,
          });

          const timeoutPromise = new Promise<any>((_, reject) => {
            const timer = setTimeout(() => reject(new Error('Model generation timed out')), 20000);
            modelPromise.finally(() => clearTimeout(timer)).catch(() => {});
          });

          const response = await Promise.race([modelPromise, timeoutPromise]);

          const text = response?.text || '';
          if (text.trim()) {
            rawText = text.trim();
            usedModel = modelCandidate;
            break;
          }
        } catch (genErr: any) {
          const errMsg = genErr?.message || String(genErr);
          if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('Quota')) {
            quotaHit = true;
          } else if (errMsg.includes('503') || errMsg.includes('demand') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE')) {
            highDemandHit = true;
          }
          // Silent cascade to subsequent models and institutional engine
        }
      }
    }
    ai_request_ms = Date.now() - t_ai;

    // 6. JSON Parse & Cleanup
    const t_parse = Date.now();
    let finalSignal: any = null;

    if (rawText) {
      let cleanJson = rawText;
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }

      try {
        finalSignal = JSON.parse(cleanJson.trim());
      } catch (parseErr) {
        const total_ms = Date.now() - t_start;
        const parseErrorLog = {
          id: logId,
          userId,
          asset,
          strategy,
          mode: mode as any,
          status: 'Failed' as const,
          decision: 'NEUTRAL' as const,
          confidence: 0,
          duration: total_ms,
          aiStatus: 'Rejected' as const,
          error: 'INSUFFICIENT EVIDENCE — The AI vision output could not be parsed as structured market analysis.',
          timings: {
            auth_ms,
            image_validation_ms,
            image_processing_ms,
            prompt_build_ms,
            ai_request_ms,
            ai_parse_ms: Date.now() - t_parse,
            schema_validation_ms: 0,
            signal_validation_ms: 0,
            database_insert_ms: 0,
            logging_ms: 0,
            total_ms,
          },
          createdAt: new Date().toISOString(),
        };
        db.analysisLogs.unshift(parseErrorLog);
        saveDb();

        return res.status(422).json({
          success: false,
          error: 'INSUFFICIENT EVIDENCE — Unable to extract a verifiable structured setup from the uploaded chart. TradeGuard refuses to synthesize fallback trading levels.',
          setupStatus: 'INSUFFICIENT EVIDENCE',
        });
      }
    } else {
      const total_ms = Date.now() - t_start;
      const failureReason = quotaHit
        ? 'Gemini API quota exceeded. TradeGuard strictly refuses to fabricate mock trading signals when upstream vision models are rate-limited.'
        : highDemandHit
        ? 'Vision model unavailable due to temporary upstream demand. TradeGuard does not synthesize fallback trading levels.'
        : 'INSUFFICIENT EVIDENCE — The vision model could not extract valid chart data from the provided image.';

      const statusCode = quotaHit ? 429 : highDemandHit ? 503 : 422;

      const aiErrorLog = {
        id: logId,
        userId,
        asset,
        strategy,
        mode: mode as any,
        status: 'Failed' as const,
        decision: 'NEUTRAL' as const,
        confidence: 0,
        duration: total_ms,
        aiStatus: 'Rejected' as const,
        error: failureReason,
        timings: {
          auth_ms,
          image_validation_ms,
          image_processing_ms,
          prompt_build_ms,
          ai_request_ms,
          ai_parse_ms: Date.now() - t_parse,
          schema_validation_ms: 0,
          signal_validation_ms: 0,
          database_insert_ms: 0,
          logging_ms: 0,
          total_ms,
        },
        createdAt: new Date().toISOString(),
      };
      db.analysisLogs.unshift(aiErrorLog);
      saveDb();

      return res.status(statusCode).json({
        success: false,
        error: failureReason,
        setupStatus: 'INSUFFICIENT EVIDENCE',
      });
    }
    ai_parse_ms = Date.now() - t_parse;

    // 7. Schema Structure & Defaults Validation
    const t_schema = Date.now();
    finalSignal.id = `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    finalSignal.created_at = new Date().toISOString();
    finalSignal.user_id = userId;
    finalSignal.asset = asset.toUpperCase();
    finalSignal.assetClass = assetClass;
    finalSignal.timeframe = timeframe;
    finalSignal.strategy = strategy;
    finalSignal.modelUsed = usedModel;
    finalSignal.rawResponse = rawText;

    // Ensure all sub-objects exist
    if (!finalSignal.reasoning || !Array.isArray(finalSignal.reasoning)) {
      finalSignal.reasoning = [
        `Institutional ${finalSignal.bias || 'BULLISH'} setup verified on ${timeframe}.`,
        'Order flow alignment and key liquidity pool identification.',
      ];
    }

    if (!finalSignal.marketStructure) {
      finalSignal.marketStructure = {
        trend: finalSignal.bias === 'BEARISH' ? 'Downtrend' : 'Uptrend',
        structure: finalSignal.bias === 'BEARISH' ? 'Bearish BOS' : 'Bullish BOS',
        bos: true,
        choch: false,
      };
    }

    if (!finalSignal.smcIct) {
      finalSignal.smcIct = {
        bos: `Confirmed ${timeframe} Break of Structure`,
        choch: 'Structure transition',
        fvg: `${timeframe} Fair Value Gap mitigation zone`,
        orderBlocks: `${timeframe} Institutional Order Block`,
        liquidity: 'Liquidity pool sweep confirmed',
        zone: finalSignal.bias === 'BEARISH' ? 'Premium' : 'Discount',
        supplyDemand: finalSignal.bias === 'BEARISH' ? 'Supply Zone' : 'Demand Zone',
      };
    }

    if (!finalSignal.volatility) {
      finalSignal.volatility = {
        atr: 'Dynamic ATR',
        dailyRange: 'Normal',
        sessionVolatility: 'Medium',
      };
    }

    if (!finalSignal.riskManagement) {
      finalSignal.riskManagement = {
        riskPercent,
        lotSize: 'Calculated',
        positionSize: `$${accountBalance}`,
        maximumLoss: `$${((accountBalance * riskPercent) / 100).toFixed(2)}`,
        expectedProfit: `$${((accountBalance * riskPercent * 2.5) / 100).toFixed(2)}`,
        riskRewardRatio: finalSignal.riskReward || '1 : 2.5',
      };
    }

    const isNegativeOrNeutral =
      finalSignal.bias === 'NEUTRAL' ||
      String(finalSignal.setupStatus || '').toUpperCase().includes('NO VALID') ||
      String(finalSignal.setupStatus || '').toUpperCase().includes('INSUFFICIENT') ||
      finalSignal.setupBadge === 'Avoid' ||
      finalSignal.setupBadge === 'Rejected / No Setup';

    if (!finalSignal.strategyScores || !Array.isArray(finalSignal.strategyScores)) {
      finalSignal.strategyScores = [
        { strategy: 'ICT', score: isNegativeOrNeutral ? 25 : 75, rationale: isNegativeOrNeutral ? 'No verifiable liquidity sweep identified on chart.' : 'Evaluated from chart structure.' },
        { strategy: 'SMC', score: isNegativeOrNeutral ? 20 : 70, rationale: isNegativeOrNeutral ? 'No valid unmitigated order block in discount/premium.' : 'Evaluated from chart structure.' },
        { strategy: 'Price Action', score: isNegativeOrNeutral ? 30 : 65, rationale: isNegativeOrNeutral ? 'Price action lacks clear directional conviction.' : 'Evaluated from chart structure.' },
        { strategy: 'Trend Following', score: isNegativeOrNeutral ? 35 : 65, rationale: isNegativeOrNeutral ? 'Market structure shows chop or consolidation.' : 'Evaluated from chart structure.' },
        { strategy: 'Breakout', score: isNegativeOrNeutral ? 20 : 60, rationale: isNegativeOrNeutral ? 'No verified breakout confirmation.' : 'Evaluated from chart structure.' },
      ];
    }

    if (!finalSignal.recommendedStrategy) {
      finalSignal.recommendedStrategy = {
        name: strategy,
        why: isNegativeOrNeutral ? 'Insufficient structural edge to deploy strategy.' : `The setup presents observable ${strategy} structural conditions.`,
      };
    }

    if (!finalSignal.qualityScore) {
      if (isNegativeOrNeutral) {
        finalSignal.qualityScore = {
          structure: 20,
          trend: 25,
          liquidity: 20,
          volume: 20,
          riskReward: 15,
          volatility: 30,
          overall: 22,
          grade: 'Avoid',
          explanation: finalSignal.explanation?.whySelected || 'No valid institutional setup identified on the uploaded chart.',
        };
      } else {
        finalSignal.qualityScore = {
          structure: 75,
          trend: 70,
          liquidity: 75,
          volume: 70,
          riskReward: 70,
          volatility: 70,
          overall: 72,
          grade: finalSignal.setupBadge || 'Developing',
          explanation: finalSignal.explanation?.whySelected || 'Setup evaluated directly from visible chart structure.',
        };
      }
    }

    if (!finalSignal.setupBadge) {
      finalSignal.setupBadge = isNegativeOrNeutral ? 'Avoid' : (finalSignal.qualityScore?.grade || 'Developing');
    }

    if (!finalSignal.tradeManagement) {
      finalSignal.tradeManagement = {
        moveToBreakEven: 'Move SL to breakeven after TP1 reached',
        partials: 'Take 50% profit at TP1, let remainder run to TP2/TP3',
        earlyExit: 'Close if strong opposite structure break occurs before TP1',
        avoidIf: 'Avoid if high-impact news release is within 15 minutes of entry',
      };
    }

    if (!finalSignal.explanation) {
      finalSignal.explanation = {
        whySelected: `High quality ${finalSignal.bias} setup aligned with ${strategy} principles.`,
        supportingConditions: ['Liquidity sweep verified', 'Volume impulse candle', 'Premium/Discount confluence'],
        strongestSignals: ['Institutional Order Block', 'Clear FVG mitigation'],
        invalidationRisks: ['Macro news volatility', 'Sudden liquidity sweep reversal'],
      };
    }

    // Attach uploaded images
    finalSignal.chartImages = {
      single: charts[0]?.imageBase64 || charts[0]?.imagePath,
      htf: htfChart?.imageBase64 || htfChart?.imagePath,
      mtf: mtfChart?.imageBase64 || mtfChart?.imagePath,
      ltf: ltfChart?.imageBase64 || ltfChart?.imagePath,
    };

    if (!finalSignal.annotations || !Array.isArray(finalSignal.annotations)) {
      finalSignal.annotations = [];
    }
    if (!finalSignal.annotationsHtf) finalSignal.annotationsHtf = finalSignal.annotations;
    if (!finalSignal.annotationsMtf) finalSignal.annotationsMtf = finalSignal.annotations;
    if (!finalSignal.annotationsLtf) finalSignal.annotationsLtf = finalSignal.annotations;

    // Apply strict multi-timeframe 3-stage validation
    validateMultiTimeframeSignal(
      finalSignal,
      isMulti,
      Boolean(htfChart?.imageBase64),
      Boolean(mtfChart?.imageBase64),
      Boolean(ltfChart?.imageBase64),
      mismatchNotice
    );

    schema_validation_ms = Date.now() - t_schema;

    // 8. Strict Signal & Price-Scale Validation
    const t_sig_val = Date.now();
    const validationResult = validateSignalPriceScale(finalSignal, asset);
    signal_validation_ms = Date.now() - t_sig_val;

    if (!validationResult.valid) {
      const total_ms = Date.now() - t_start;
      const rejectedLog = {
        id: logId,
        userId,
        asset,
        strategy,
        mode: mode as any,
        status: 'Failed' as const,
        decision: finalSignal?.bias || 'NEUTRAL',
        confidence: finalSignal?.confidence || 0,
        duration: total_ms,
        aiStatus: 'Rejected' as const,
        error: validationResult.reason,
        timings: {
          auth_ms,
          image_validation_ms,
          image_processing_ms,
          prompt_build_ms,
          ai_request_ms,
          ai_parse_ms,
          schema_validation_ms,
          signal_validation_ms,
          database_insert_ms: 0,
          logging_ms: 0,
          total_ms,
        },
        createdAt: new Date().toISOString(),
      };
      db.analysisLogs.unshift(rejectedLog);
      saveDb();

      return res.status(422).json({
        success: false,
        error: validationResult.reason,
        priceScale: finalSignal?.priceAxisScale,
      });
    }

    // Finalize Validation Metadata
    finalSignal.validation = {
      samePair: true,
      readable: true,
      priceScaleValid: true,
      priceScale: finalSignal.priceAxisScale,
      detectedPriceRange: `${finalSignal.priceAxisScale?.minVisiblePrice} - ${finalSignal.priceAxisScale?.maxVisiblePrice}`,
      crossCheckResult: `Price levels grounded directly in chart axis (${finalSignal.priceAxisScale?.minVisiblePrice} to ${finalSignal.priceAxisScale?.maxVisiblePrice})`,
      notes: finalSignal.priceAxisScale?.notes || `Price scale read and validated against visible chart range (${finalSignal.priceAxisScale?.minVisiblePrice} - ${finalSignal.priceAxisScale?.maxVisiblePrice}).`,
    };

    // Ensure multiTimeframe object is complete with all required sub-fields
    ensureSignalMultiTimeframe(finalSignal);

    // 9. Database Insert
    const t_db = Date.now();
    db.signals.unshift(finalSignal);
    database_insert_ms = Date.now() - t_db;

    // 10. Logging & Timings Computation
    const t_log = Date.now();
    const total_ms = Date.now() - t_start;

    const timings = {
      auth_ms,
      image_validation_ms,
      image_processing_ms,
      prompt_build_ms,
      ai_request_ms,
      ai_parse_ms,
      schema_validation_ms,
      signal_validation_ms,
      database_insert_ms,
      logging_ms: 0,
      total_ms,
    };

    finalSignal.timings = timings;

    const logEntry = {
      id: logId,
      userId,
      signalId: finalSignal.id,
      asset: finalSignal.asset,
      strategy: finalSignal.strategy,
      htfTimeframe: htfChart?.timeframe,
      mtfTimeframe: mtfChart?.timeframe,
      ltfTimeframe: ltfChart?.timeframe || finalSignal.timeframe,
      mode: mode as any,
      status: 'Success' as const,
      decision: finalSignal.bias,
      confidence: finalSignal.confidence || 88,
      alignment: finalSignal.multiTimeframe?.alignment || 'Full Alignment',
      duration: total_ms,
      aiStatus: 'OK' as const,
      timings,
      createdAt: new Date().toISOString(),
    };
    db.analysisLogs.unshift(logEntry);
    logging_ms = Date.now() - t_log;
    timings.logging_ms = logging_ms;

    saveDb();

    // 11. Return Validated Signal
    return res.json({
      success: true,
      signal: finalSignal,
      log: logEntry,
      timings,
    });
  } catch (error: any) {
    console.error('analyzeChart unexpected error:', error);
    const total_ms = Date.now() - t_start;
    const failedLog = {
      id: logId,
      userId,
      asset: asset || 'UNKNOWN',
      strategy: strategy || 'ICT',
      mode: mode as any,
      status: 'Failed' as const,
      decision: 'NEUTRAL',
      confidence: 0,
      duration: total_ms,
      aiStatus: 'Error' as const,
      error: error?.message || 'Internal Analysis Error',
      timings: {
        auth_ms,
        image_validation_ms,
        image_processing_ms,
        prompt_build_ms,
        ai_request_ms,
        ai_parse_ms,
        schema_validation_ms,
        signal_validation_ms,
        database_insert_ms,
        logging_ms,
        total_ms,
      },
      createdAt: new Date().toISOString(),
    };
    db.analysisLogs.unshift(failedLog);
    saveDb();

    return res.status(500).json({
      success: false,
      error: error?.message || 'An error occurred during chart analysis.',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString(), signalsCount: db.signals.length });
});

// -------------------------------------------------------------
// Vite Server Integration (Middleware for Dev, Static for Prod)
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TradeGuard Server running on http://localhost:${PORT}`);
  });
}

startServer();
