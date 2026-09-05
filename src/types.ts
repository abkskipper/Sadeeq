export type AssetClass = 'Forex' | 'Crypto' | 'Indices' | 'Commodities' | 'Stocks' | 'Synthetic';

export type Timeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1' | 'W1' | 'MN';

export type Strategy =
  | 'SMC'
  | 'ICT'
  | 'CRT'
  | 'Price Action'
  | 'Trend Following'
  | 'Breakout'
  | 'Pullback'
  | 'Range Trading'
  | 'Momentum'
  | 'Mean Reversion'
  | 'Scalping'
  | 'Swing Trading';

export type TradeBias = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export type SetupGrade = 'A+' | 'A' | 'B' | 'C' | 'High Risk' | 'Avoid';

export type ChartQuality = 'ANALYZABLE' | 'PARTIALLY ANALYZABLE' | 'UNREADABLE';

export type AplusSetupStatus = 'A+ CONFIRMED' | 'DEVELOPING' | 'NO VALID SETUP' | 'INSUFFICIENT EVIDENCE';

export interface AplusHtfZoneInfo {
  status: 'VALID' | 'INVALID' | 'UNCLEAR';
  type: 'HTF Supply' | 'HTF Demand';
  zoneRange: string;
  upperBoundary: number | string;
  lowerBoundary: number | string;
  timeframe: string;
  structuralOrigin: string;
  notes: string;
}

export interface AplusMitigationInfo {
  status: 'FIRST MITIGATION' | 'RE-MITIGATION' | 'UNMITIGATED' | 'UNCLEAR';
  entryDepth: string;
  reactionProduced: string;
  liquidityPresent: string;
}

export interface AplusInducementInfo {
  status: 'IDENTIFIED' | 'NOT IDENTIFIED' | 'UNCLEAR';
  level: number | string;
  type: string;
  description: string;
}

export interface AplusLiquiditySweepInfo {
  status: 'CONFIRMED' | 'NOT CONFIRMED' | 'UNCLEAR';
  sweptLevel: number | string;
  sweepType: 'Buy-Side Liquidity Sweep' | 'Sell-Side Liquidity Sweep' | string;
  wickVsBodyClose: string;
  subsequentDelivery: string;
  rejectionValidation: string;
}

export interface AplusProtectedLevelInfo {
  type: 'PROTECTED HIGH' | 'PROTECTED LOW';
  price: number | string;
  causalConnection: string;
  invalidationRole: string;
}

export interface AplusFailureToSwingInfo {
  status: 'CONFIRMED' | 'NOT CONFIRMED' | 'DEVELOPING';
  attemptedSwingLevel: number | string;
  failurePoint: number | string;
  triggerFailureLowHigh: number | string;
  structuralMechanism: string;
}

export interface AplusChangeInStateOfDeliveryInfo {
  status: 'CONFIRMED' | 'DEVELOPING' | 'NOT CONFIRMED';
  shiftType: 'Bullish to Bearish' | 'Bearish to Bullish';
  responsibleCandleStructure: string;
  breakCloseLevel: number | string;
  detailedSequence: string;
}

export interface AplusPoiInfo {
  status: 'VALID' | 'INVALID' | 'UNCLEAR';
  type: 'Bearish Order Block' | 'Bullish Order Block' | 'Fair Value Gap (FVG)' | 'Breaker Block' | 'Displacement Origin';
  priceRange: string;
  upperLevel: number | string;
  lowerLevel: number | string;
  causalConnectionToDeliveryChange: string;
}

export interface AplusPoiMitigationInfo {
  status: 'CONFIRMED' | 'PENDING' | 'NOT REACHED';
  retracementDepth: string;
  reactionConfirmation: string;
  protectedStructureIntact: boolean;
}

export interface AplusSniperEntryInfo {
  entryPrice: number | string;
  alternativeEntryPrice?: number | string;
  executionTimeframe: '15M' | 'H1' | string;
  confirmationType: string;
  entryRationale: string;
  entryModelRank?: string;
}

export interface AplusInvalidationStopLossInfo {
  stopLossPrice: number | string;
  bufferAmount: number | string;
  structureReference: string;
  rationale: string;
}

export interface AplusLiquidityTargetsInfo {
  tp1: number | string;
  tp1LiquidityType: 'Internal Range Liquidity' | 'Equal Lows' | 'Equal Highs' | 'Previous Swing Low' | 'Previous Swing High' | string;
  tp2?: number | string;
  tp2LiquidityType?: 'External Range Liquidity' | 'Major Swing Low' | 'Major Swing High' | 'Opposing Liquidity Pool' | string;
  tp3?: number | string;
}

export interface AplusChecklistItem {
  stepNumber: number;
  condition: string;
  status: 'CONFIRMED' | 'PENDING' | 'FAILED';
  evidence: string;
}

export interface AplusConfluenceComponent {
  id: number;
  name: string; // e.g. "1. 4H Directional Bias", "2. 1H Structural Alignment", etc.
  status: 'CONFIRMED' | 'PARTIAL' | 'MISSING';
  evidence: string;
}

export interface AplusConfluenceAudit {
  score: number; // 0-12
  confirmedCount: number;
  totalComponents: 12;
  grade: 'A+' | 'A' | 'B' | 'Developing' | 'Rejected / No Setup';
  isAplusQualified: boolean;
  components: AplusConfluenceComponent[];
  summary: string;
  rejectionReason?: string;
}

export interface AplusSmcSequence {
  direction: 'SELL' | 'BUY' | 'NEUTRAL';
  setupGrade: 'A+' | 'A' | 'B' | 'Developing' | 'No Setup';
  chartQuality: ChartQuality;
  setupStatus: AplusSetupStatus;
  htfSupplyDemand: AplusHtfZoneInfo;
  htfMitigation: AplusMitigationInfo;
  inducement: AplusInducementInfo;
  liquiditySweep: AplusLiquiditySweepInfo;
  protectedLevel: AplusProtectedLevelInfo;
  failureToSwing: AplusFailureToSwingInfo;
  changeInStateOfDelivery: AplusChangeInStateOfDeliveryInfo;
  poi: AplusPoiInfo;
  poiMitigation: AplusPoiMitigationInfo;
  sniperEntry: AplusSniperEntryInfo;
  stopLoss: AplusInvalidationStopLossInfo;
  takeProfitTargets: AplusLiquidityTargetsInfo;
  calculatedRiskReward: string;
  checklist: AplusChecklistItem[];
  missingConditions?: string[];
  causalReasoningSequence: string[];
  confluenceAudit?: AplusConfluenceAudit;
}

export type TradeOutcome = 'Win' | 'Loss' | 'Breakeven' | 'Pending';

export type WatchlistStatus = 'Active' | 'Closed' | 'Invalidated';

export type UserRole = 'user' | 'admin' | 'super_admin' | 'trader';

export type SessionName = 'Asia' | 'London' | 'New York' | 'London/NY Overlap' | 'Asia/London Overlap' | 'Off-Session';

export type AnnotationType =
  | 'Entry'
  | 'Stop Loss'
  | 'Take Profit'
  | 'Take Profit 2'
  | 'Take Profit 3'
  | 'Supply Zone'
  | 'Demand Zone'
  | 'Order Block'
  | 'FVG'
  | 'Liquidity'
  | 'BOS'
  | 'CHOCH'
  | 'Risk Zone'
  | 'Reward Zone'
  | 'Support'
  | 'Resistance'
  | 'Trendline'
  | 'Fibonacci'
  | 'Premium Zone'
  | 'Discount Zone'
  | 'Equilibrium'
  | 'Equal Highs'
  | 'Equal Lows'
  | 'Protected High'
  | 'Protected Low'
  | 'Breaker Block'
  | 'Mitigation Block'
  | 'Rejection Block'
  | 'Volume Imbalance'
  | 'CISD'
  | 'Liquidity Sweep'
  | 'Buy-Side Liquidity'
  | 'Sell-Side Liquidity'
  | 'Internal Liquidity'
  | 'External Liquidity'
  | 'HH'
  | 'HL'
  | 'LH'
  | 'LL'
  | 'Swing High'
  | 'Swing Low'
  | 'POI'
  | 'Confirmation'
  | 'Asia Session'
  | 'London Session'
  | 'New York Session';

export interface ChartAnnotation {
  id?: string;
  type: AnnotationType | string;
  x: number; // percentage 0-100 or pixel coordinate
  y: number; // percentage 0-100 or pixel coordinate
  x2?: number; // percentage 0-100
  y2?: number; // percentage 0-100
  label: string;
  price?: number | string;
  color?: string;
  description?: string;
}

export interface ChartImageInput {
  role: 'HTF' | 'MTF' | 'LTF' | 'SINGLE';
  timeframe: Timeframe;
  imageBase64: string;
  imageMime: string;
  imagePath?: string;
}

export interface MarketStructureInfo {
  trend: 'Uptrend' | 'Downtrend' | 'Ranging' | 'Reversal' | 'Consolidation' | string;
  structure: 'Bullish BOS' | 'Bearish BOS' | 'Bullish CHOCH' | 'Bearish CHOCH' | 'Range Bound' | string;
  swingHigh?: string;
  swingLow?: string;
  protectedHigh?: string;
  protectedLow?: string;
  bos?: boolean;
  choch?: boolean;
}

export interface SmcIctInfo {
  bos: string;
  choch: string;
  fvg: string;
  orderBlocks: string;
  liquidity: string;
  zone: 'Premium' | 'Discount' | 'Equilibrium' | string;
  supplyDemand?: string;
  imbalances?: string;
  sweepDetails?: string;
}

export interface VolatilityInfo {
  atr: string;
  dailyRange: string;
  sessionVolatility: 'High' | 'Medium' | 'Low' | 'Extreme' | string;
}

export interface RiskManagementInfo {
  riskPercent: number;
  lotSize: number | string;
  positionSize: string;
  maximumLoss: string;
  expectedProfit: string;
  riskRewardRatio?: string;
}

export interface HigherTimeframeAnalysis {
  analyzed: boolean;
  timeframe: string; // e.g. "4H"
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  structure: string; // Major market direction & swing structure
  liquidity: string; // Major liquidity pools / external range liquidity
  poi: string; // Major HTF Supply / Demand or Order Block / FVG
  swingHigh?: string | number;
  swingLow?: string | number;
  protectedLevel?: string;
  premiumDiscount?: string;
  notes?: string;
  timeframeMismatchFlag?: boolean;
}

export interface MiddleTimeframeAnalysis {
  analyzed: boolean;
  timeframe: string; // e.g. "1H"
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  structure: string; // Refined market structure
  bosChoch: string; // BOS or CHoCH / MSS detail
  liquidity: string; // Liquidity sweep detail / inducement
  poi: string; // Refined POI, Order Block, FVG, Breaker
  displacement?: string;
  alignmentWithHtf: 'Aligned' | 'Retracement' | 'Conflict' | 'Mitigation' | string;
  notes?: string;
  timeframeMismatchFlag?: boolean;
}

export interface LowerTimeframeAnalysis {
  analyzed: boolean;
  timeframe: string; // e.g. "15M"
  confirmation: 'CONFIRMED' | 'UNCONFIRMED' | 'DEVELOPING' | 'INVALIDATED' | string;
  mssChoch: string; // Lower timeframe MSS/CHoCH
  displacement: string; // Displacement candle evidence
  fvgOb: string; // FVG / Order block execution zone
  entry: string | number; // Exact sniper entry level
  invalidation: string | number; // Exact structural invalidation SL
  shortTermLiquidityTargets?: string;
  notes?: string;
  timeframeMismatchFlag?: boolean;
}

export interface MultiTimeframeFinalDecision {
  direction: 'BUY' | 'SELL' | 'WAIT';
  entry: string | number;
  sl: string | number;
  tp1: string | number;
  tp2?: string | number;
  rr: string;
  confidence: number;
  grade: string;
}

export interface MultiTimeframeInfo {
  overallBias: TradeBias | string;
  htfTrend: string;
  mtfContext?: string;
  ltfConfirmation: string;
  alignment: 'Full Alignment' | 'Partial Alignment' | 'Divergence' | 'Counter-Trend' | string;
  crossTimeframeReasoning?: string;
  htfAnalyzed: boolean;
  mtfAnalyzed: boolean;
  ltfAnalyzed: boolean;
  allTimeframesAnalyzed: boolean;
  higherTimeframe?: HigherTimeframeAnalysis;
  middleTimeframe?: MiddleTimeframeAnalysis;
  lowerTimeframe?: LowerTimeframeAnalysis;
  finalDecision?: MultiTimeframeFinalDecision;
  timeframeMismatchNotice?: string;
  perTimeframe?: {
    htf?: string;
    mtf?: string;
    ltf?: string;
  };
}

export interface StrategyScoreItem {
  strategy: Strategy;
  score: number; // 0-100
  rationale: string;
}

export interface QualityScoreInfo {
  structure: number; // 0-100
  trend: number; // 0-100
  liquidity: number; // 0-100
  volume: number; // 0-100
  riskReward: number; // 0-100
  volatility: number; // 0-100
  overall: number; // 0-100
  grade: SetupGrade;
  explanation: string;
}

export interface TradeManagementInfo {
  moveToBreakEven: string;
  partials: string;
  earlyExit: string;
  avoidIf: string;
}

export interface ExplanationInfo {
  whySelected: string;
  supportingConditions: string[];
  strongestSignals: string[];
  invalidationRisks: string[];
}

export interface PriceAxisScale {
  minVisiblePrice: number;
  maxVisiblePrice: number;
  currentVisiblePrice: number;
  priceAxisLabelsFound: string[];
  priceRange?: number;
  instrumentDetected?: string;
  timeframeDetected?: string;
  confidenceInPriceReading?: number;
}

export interface SignalValidationInfo {
  samePair: boolean;
  readable: boolean;
  notes: string;
  priceScaleValid?: boolean;
  priceScale?: PriceAxisScale;
  detectedPriceRange?: string;
  crossCheckResult?: string;
}

export interface TradeSignal {
  id: string;
  created_at: string;
  user_id?: string;
  asset: string;
  assetClass: AssetClass;
  timeframe: Timeframe;
  strategy: Strategy;
  bias: TradeBias;
  entry: string | number;
  alternativeEntry?: string | number;
  stopLoss: string | number;
  takeProfit: string | number;
  takeProfit2?: string | number;
  takeProfit3?: string | number;
  riskReward: string;
  confidence: number; // 0-100
  session: SessionName | string;
  priceAxisScale?: PriceAxisScale;
  reasoning: string[];
  marketStructure: MarketStructureInfo;
  smcIct: SmcIctInfo;
  volatility: VolatilityInfo;
  riskManagement: RiskManagementInfo;
  multiTimeframe?: MultiTimeframeInfo;
  strategyScores: StrategyScoreItem[];
  recommendedStrategy: {
    name: Strategy | string;
    why: string;
  };
  qualityScore: QualityScoreInfo;
  setupBadge: SetupGrade;
  chartQuality?: ChartQuality;
  setupStatus?: AplusSetupStatus;
  aplusSmc?: AplusSmcSequence;
  aplusConfluenceAudit?: AplusConfluenceAudit;
  tradeManagement: TradeManagementInfo;
  explanation: ExplanationInfo;
  annotations: ChartAnnotation[];
  annotationsHtf?: ChartAnnotation[];
  annotationsMtf?: ChartAnnotation[];
  annotationsLtf?: ChartAnnotation[];
  validation: SignalValidationInfo;
  chartImagePaths?: string[];
  chartImages?: {
    single?: string;
    htf?: string;
    mtf?: string;
    ltf?: string;
  };
  status?: WatchlistStatus;
  outcome?: TradeOutcome;
  pnlR?: number;
  notes?: string;
  rawResponse?: string;
  modelUsed?: string;
  quotaNotice?: string;
  timings?: AnalysisTimings;
}

export interface WatchlistItem {
  id: string;
  signal_id: string;
  user_id: string;
  asset: string;
  timeframe: Timeframe;
  strategy: Strategy;
  bias: TradeBias;
  entry: string | number;
  stopLoss: string | number;
  takeProfit: string | number;
  riskReward: string;
  confidence: number;
  setupBadge: SetupGrade;
  status: WatchlistStatus;
  notes?: string;
  created_at: string;
  signal?: TradeSignal;
}

export interface AnalysisTimings {
  auth_ms: number;
  image_validation_ms: number;
  image_processing_ms: number;
  prompt_build_ms: number;
  ai_request_ms: number;
  ai_parse_ms: number;
  schema_validation_ms: number;
  signal_validation_ms: number;
  database_insert_ms: number;
  logging_ms: number;
  total_ms: number;
}

export interface AnalysisLog {
  id: string;
  userId?: string;
  signalId?: string;
  asset: string;
  strategy: Strategy;
  htfTimeframe?: Timeframe;
  mtfTimeframe?: Timeframe;
  ltfTimeframe?: Timeframe;
  mode: 'single' | 'multi';
  status: 'Success' | 'Failed' | 'Pending';
  decision: TradeBias | string;
  confidence: number;
  alignment?: string;
  duration: number; // in milliseconds
  aiStatus: 'OK' | 'RateLimited' | 'Error' | 'Fallback';
  error?: string;
  timings?: AnalysisTimings;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}
