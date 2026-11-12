export type AssetClass = 'Forex' | 'Crypto' | 'Indices' | 'Commodities' | 'Stocks' | 'Synthetic';

export type Timeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1' | 'W1' | 'MN';

// Production strategies: SMC, ICT, CRT, and Price Action
export type Strategy = 'SMC' | 'ICT' | 'CRT' | 'Price Action';
export type StrategyInput = Strategy | 'PRICE_ACTION' | 'PA' | 'PriceAction';

// Versioning constants
export const TRADEGUARD_ENGINE_VERSION = 'TG-CORE-2.0';
export const TRADEGUARD_PROMPT_VERSION = 'TG-MULTI-STRAT-2.0';
export const TRADEGUARD_SCHEMA_VERSION = 'TG-ANALYSIS-2.0';
export const TRADEGUARD_MODEL_DEFAULT = 'gemini-3.6-flash';

export type TradeBias = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export type SetupGrade = 'A+' | 'A' | 'B' | 'Developing' | 'Avoid' | 'NO_TRADE';

export type AnalysisExecutionState =
  | 'ANALYSIS_SUCCESS'
  | 'ANALYSIS_NO_SETUP'
  | 'ANALYSIS_FAILED'
  | 'GEMINI_RATE_LIMIT'
  | 'GEMINI_UNAVAILABLE'
  | 'INVALID_CHART_INPUT'
  | 'INVALID_MODEL_CONFIGURATION'
  | 'INVALID_AI_RESPONSE'
  | 'VALIDATION_FAILED';

export type ChartQuality = 'Readable' | 'Partially readable' | 'Unreadable' | 'ANALYZABLE' | 'PARTIALLY ANALYZABLE' | 'UNREADABLE';

export type AplusSetupStatus =
  | 'A+ SETUP'
  | 'VALID SETUP'
  | 'WAIT — NO VALID A+ SETUP'
  | 'INVALID'
  | 'A+ CONFIRMED'
  | 'CONFIRMED'
  | 'DEVELOPING'
  | 'WAIT'
  | 'NO VALID SETUP'
  | 'INSUFFICIENT EVIDENCE'
  | 'NO_SETUP';

export interface AplusHtfZoneInfo {
  status: 'VALID' | 'INVALID' | 'UNCLEAR';
  type: 'HTF Supply' | 'HTF Demand' | string;
  zoneType?: 'SUPPLY' | 'DEMAND';
  zoneHigh?: number | string;
  zoneLow?: number | string;
  zoneRange: string;
  upperBoundary?: number | string;
  lowerBoundary?: number | string;
  timeframe: string;
  structuralOrigin: string;
  evidence?: string;
  validity?: string;
  notes?: string;
}

export interface AplusMitigationInfo {
  status: 'FIRST MITIGATION' | 'RE-MITIGATION' | 'UNMITIGATED' | 'UNCLEAR' | 'CONFIRMED' | 'PENDING';
  entryDepth: string;
  reactionProduced: string;
  liquidityPresent: string;
  evidence?: string;
  candleVerification?: string;
}

export interface AplusInducementInfo {
  status: 'IDENTIFIED' | 'NOT IDENTIFIED' | 'UNCLEAR' | 'AWAITING';
  inducedDirection?: 'EARLY_SELLERS' | 'EARLY_BUYERS' | string;
  level: number | string;
  type: string;
  purpose?: string;
  description: string;
  evidence?: string;
}

export interface AplusLiquiditySweepInfo {
  status: 'CONFIRMED' | 'NOT CONFIRMED' | 'UNCLEAR';
  sweptLevel: number | string;
  sweepType: 'Buy-Side Liquidity Sweep' | 'Sell-Side Liquidity Sweep' | string;
  liquidityType?: string;
  sweepHigh?: number | string | null;
  sweepLow?: number | string | null;
  sweepLocation?: string;
  relationshipToHTFZone?: string;
  wickVsBodyClose: string;
  subsequentDelivery?: string;
  rejectionValidation: string;
  evidence?: string;
}

export interface AplusHtfZoneValidation {
  isValidated: boolean;
  mitigationVerified: boolean;
  sweepVerified: boolean;
  validationRationale: string;
}

export interface AplusProtectedLevelInfo {
  type: 'PROTECTED HIGH' | 'PROTECTED LOW';
  price: number | string;
  timeframe?: string;
  reason?: string;
  invalidationCondition?: string;
  causalConnection: string;
  invalidationRole: string;
}

export interface AplusFailureToSwingInfo {
  status: 'CONFIRMED' | 'NOT CONFIRMED' | 'DEVELOPING' | 'AWAITING_SECOND_ATTEMPT' | 'FAILED';
  attemptedSwingLevel?: number | string;
  failurePoint: number | string;
  triggerFailureLowHigh: number | string;
  structuralMechanism: string;
  evidence?: string;
}

export interface AplusChangeInStateOfDeliveryInfo {
  status: 'CONFIRMED' | 'DEVELOPING' | 'NOT CONFIRMED';
  shiftType: 'Bullish to Bearish' | 'Bearish to Bullish' | string;
  responsibleCandleStructure: string;
  breakCloseLevel: number | string;
  triggerLevel?: number | string;
  detailedSequence: string;
  evidence?: string;
}

export interface AplusPoiInfo {
  status: 'VALID' | 'INVALID' | 'UNCLEAR';
  type: 'Bearish Order Block' | 'Bullish Order Block' | 'Fair Value Gap (FVG)' | 'Breaker Block' | 'Displacement Origin' | string;
  poiType?: string;
  poiHigh?: number | string;
  poiLow?: number | string;
  priceRange: string;
  upperLevel?: number | string;
  lowerLevel?: number | string;
  timeframe?: string;
  origin?: string;
  evidence?: string;
  validity?: string;
  causalConnectionToDeliveryChange: string;
}

export interface AplusPoiMitigationInfo {
  status: 'CONFIRMED' | 'PENDING' | 'NOT REACHED' | 'MITIGATED';
  executionTimeframe?: string;
  retracementDepth: string;
  reactionConfirmation: string;
  protectedStructureIntact?: boolean;
  evidence?: string;
}

export interface AplusSniperEntryInfo {
  entryPrice: number | string;
  alternativeEntryPrice?: number | string;
  executionTimeframe: '15M' | 'H1' | string;
  confirmationType: string;
  entryRationale?: string;
  entryModelRank?: string;
}

export interface AplusInvalidationStopLossInfo {
  stopLossPrice: number | string;
  bufferAmount: number | string;
  structureReference?: string;
  protectedExtremeReference?: number | string;
  structuralAnchorRole?: string;
  rationale: string;
}

export interface AplusLiquidityTargetsInfo {
  tp1: number | string;
  tp1LiquidityType: 'Internal Range Liquidity' | 'Equal Lows' | 'Equal Highs' | 'Previous Swing Low' | 'Previous Swing High' | string;
  tp2?: number | string;
  tp2LiquidityType?: 'External Range Liquidity' | 'Major Swing Low' | 'Major Swing High' | 'Opposing Liquidity Pool' | string;
  tp3?: number | string;
  rationale?: string;
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

export interface EvidenceConfirmationItem {
  name: string;
  category: 'REQUIRED' | 'CONFIRMATORY' | 'OPTIONAL';
  status: 'CONFIRMED' | 'DEVELOPING' | 'OPTIONAL' | 'NOT_VISIBLE' | 'FAILED';
  evidence: string;
  confidence: number;
}

export interface AplusConfluenceAudit {
  score: number; // e.g. confirmed count
  confirmedCount: number;
  totalComponents: number;
  grade: 'A+' | 'A' | 'B' | 'Developing' | 'Rejected / No Setup';
  isAplusQualified: boolean;
  strategy?: Strategy;
  components: AplusConfluenceComponent[];
  summary: string;
  rejectionReason?: string;
}

export interface AplusSmcSequence {
  direction?: 'SELL' | 'BUY' | 'NEUTRAL';
  setupGrade?: 'A+' | 'A' | 'B' | 'Developing' | 'No Setup';
  chartQuality?: ChartQuality;
  setupStatus?: AplusSetupStatus;
  htfSupplyDemand: AplusHtfZoneInfo;
  htfMitigation: AplusMitigationInfo;
  inducement: AplusInducementInfo;
  liquiditySweep: AplusLiquiditySweepInfo;
  htfZoneValidation?: AplusHtfZoneValidation;
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
  accountBalance?: number;
  riskAmount?: number;
  stopDistancePipsOrPoints?: number | string;
  invalidationRisks?: string[];
  maxDrawdownRisk?: string;
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

export interface CrtAnalysisDetails {
  rangeFormation: string;
  referenceHigh?: string | number;
  referenceLow?: string | number;
  rangeSweepConfirmed: boolean;
  rejectionConfirmed: boolean;
  ltfConfirmationConfirmed: boolean;
  directionalIntent: string;
  entryLevel?: string | number;
  invalidationLevel?: string | number;
  targetLevel?: string | number;
  notes?: string;
}

export interface SmcAnalysisDetails {
  htfSupplyDemandPresent: boolean;
  poiPresent: boolean;
  mitigationPresent: boolean;
  inducementPresent: boolean;
  liquiditySweepPresent: boolean;
  protectedLevelPresent: boolean;
  failureToSwingPresent: boolean;
  cisdPresent: boolean;
  displacementPresent: boolean;
  bosChochPresent: boolean;
  poiRefinementPresent: boolean;
  entryConfirmed: boolean;
  allCriticalConditionsMet: boolean;
}

export interface IctAnalysisDetails {
  drawOnLiquidity: string;
  drawOnLiquidityTarget?: string | number;
  buySideLiquidityPool?: string | number;
  sellSideLiquidityPool?: string | number;
  liquidityRunConfirmed: boolean;
  marketStructureShift: string;
  displacementConfirmed: boolean;
  fvgPresent: boolean;
  fvgBoundaries?: string;
  oteFibonacciZone?: string; // 62% - 79% equilibrium/discount/premium
  killzoneAlignment?: string; // London Open, NY AM, London Close, Asia
  orderBlockExecution?: string;
  invalidationAnchor: string;
  notes?: string;
}

export interface PriceActionAnalysisDetails {
  keySupportResistanceLevel: string | number;
  levelType: 'HORIZONTAL_SUPPORT' | 'HORIZONTAL_RESISTANCE' | 'POLARITY_FLIP' | 'DYNAMIC_TRENDLINE';
  multiTouchConfluenceCount: number;
  candlestickPattern: string; // e.g. Pinbar rejection, Engulfing candle, Morning/Evening star
  breakoutRetestConfirmed: boolean;
  trendlineConfluence?: string;
  swingTargetLevel: string | number;
  structuralExhaustionEvidence: string;
  invalidationAnchor: string;
  notes?: string;
}

export type InstitutionalStageState =
  | 'Confirmed'
  | 'Unconfirmed'
  | 'Awaiting confirmation'
  | 'Failed'
  | 'Not observable from the uploaded chart';

export type AnalysisStateMachineState =
  | 'INSUFFICIENT_DATA'
  | 'BIAS_ESTABLISHED'
  | 'WAITING_FOR_ZONE'
  | 'WAITING_FOR_MITIGATION'
  | 'WAITING_FOR_LIQUIDITY_SWEEP'
  | 'WAITING_FOR_PROTECTED_LEVEL'
  | 'WAITING_FOR_FAILURE_TO_SWING'
  | 'WAITING_FOR_CISD'
  | 'WAITING_FOR_DISPLACEMENT'
  | 'WAITING_FOR_POI'
  | 'WAITING_FOR_RETEST'
  | 'WAITING_FOR_ENTRY_TRIGGER'
  | 'ENTRY_VALIDATED'
  | 'SETUP_INVALIDATED';

export interface InstitutionalChecklistStage {
  stageNumber: number;
  name: string;
  state: InstitutionalStageState;
  explanation: string;
  chartEvidence: string;
}

export interface InstitutionalTradePlan {
  direction: 'BUY' | 'SELL' | 'NO TRADE';
  setupGrade: string;
  entryZoneOrPrice: string | number;
  entryTrigger?: string;
  whyEntryIsNotLiquidity?: string;
  stopLossPrice: string | number;
  target1: string | number;
  target2?: string | number;
  target3?: string | number;
  riskRewardTarget1: string;
  riskRewardTarget2?: string;
  riskRewardTarget3?: string;
  protectedLevel: {
    type: string;
    price: string | number;
    timeframe?: string;
    reason?: string;
    invalidationCondition?: string;
  };
  liquiditySweepLevel: string | number;
  cisdReferenceLevel: string | number;
  poiBoundaries: string;
  setupInvalidationLevel: string | number;
}

export interface InstitutionalTradeNarrative {
  chronologicalSequence: string[];
  summary: string;
  nextRequiredMarketAction: string;
}

export interface InstitutionalRejectionReason {
  condition: string;
  detail: string;
  failedStage?: string;
}

export interface ConfidenceAndLimitations {
  imageReadabilityConfidence: number; // 0-100
  structuralInterpretationConfidence: number; // 0-100
  setupCompletenessConfidence: number; // 0-100
  priceMeasurementConfidence: number; // 0-100
  overallConfidence: number; // 0-100
  limitationsNotice: string;
  calibrationDisclaimer: string;
}

export interface InstitutionalMarketOverview {
  instrument: string;
  analysisTimestamp: string;
  selectedStrategy: string;
  higherTimeframe: string;
  middleTimeframe: string;
  lowerTimeframe: string;
  overallDirectionalBias: string;
  setupStatus: string;
}

export interface TradeSignal {
  id: string;
  created_at: string;
  user_id?: string;
  engineVersion?: string;
  promptVersion?: string;
  schemaVersion?: string;
  modelVersion?: string;
  asset: string;
  assetClass: AssetClass;
  timeframe: Timeframe;
  strategy: Strategy;
  bias: TradeBias;
  entry: string | number | null;
  alternativeEntry?: string | number;
  stopLoss: string | number | null;
  takeProfit: string | number | null;
  takeProfit2?: string | number | null;
  takeProfit3?: string | number | null;
  riskReward: string;
  confidence: number; // 0-100
  session: SessionName | string;
  priceAxisScale?: PriceAxisScale;
  reasoning: string[];
  evidence?: string[];
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
  analysisStatus?: 'SUCCESS' | 'NO_SETUP' | 'FAILED';
  executionState?: AnalysisExecutionState;
  aplusSmc?: AplusSmcSequence;
  aplusConfluenceAudit?: AplusConfluenceAudit;
  confirmationItems?: EvidenceConfirmationItem[];
  crtDetails?: CrtAnalysisDetails;
  smcDetails?: SmcAnalysisDetails;
  ictDetails?: IctAnalysisDetails;
  priceActionDetails?: PriceActionAnalysisDetails;
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
  // Institutional A+ Formats
  marketOverview?: InstitutionalMarketOverview;
  institutionalChecklist?: InstitutionalChecklistStage[];
  tradePlan?: InstitutionalTradePlan;
  tradeNarrative?: InstitutionalTradeNarrative;
  rejectionReasons?: InstitutionalRejectionReason[];
  confidenceAndLimitations?: ConfidenceAndLimitations;
  stateMachineState?: AnalysisStateMachineState;
  whyEntryIsNotLiquidity?: string;
  whatMustHappenNext?: string;
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
  modelUsed?: string;
  modelVersion?: string;
  promptVersion?: string;
  schemaVersion?: string;
  engineVersion?: string;
  uploadedChartsCount?: number;
  validationResult?: 'Passed' | 'Rejected' | 'Not Applicable';
  validationNotes?: string;
  finalSetupStatus?: string;
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
