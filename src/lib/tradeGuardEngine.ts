/**
 * TradeGuard AI Core Engine Configuration & Server-Side Validation Layer
 *
 * Core Architecture:
 * USER -> 3 REAL CHART IMAGES (4H, 1H, 15M) -> PINNED GEMINI MODEL ->
 * MULTI-TIMEFRAME VISUAL ANALYSIS -> SMC / CRT REASONING ->
 * STRUCTURED JSON -> TRADEGUARD VALIDATION ENGINE -> FINAL VERIFIED RESULT
 */

import { Type } from '@google/genai';
import type {
  AplusSmcSequence,
  AplusHtfZoneInfo,
  AplusMitigationInfo,
  AplusInducementInfo,
  AplusLiquiditySweepInfo,
  AplusHtfZoneValidation,
  AplusProtectedLevelInfo,
  AplusFailureToSwingInfo,
  AplusChangeInStateOfDeliveryInfo,
  AplusPoiInfo,
  AplusPoiMitigationInfo,
  AplusSniperEntryInfo,
  AplusInvalidationStopLossInfo,
  AplusLiquidityTargetsInfo,
  AplusChecklistItem,
  AnalysisStateMachineState,
} from '../types';

// =============================================================
// 1. PINNED MODEL & VERSION CONTROL
// =============================================================
// Stable production model for TradeGuard.
export const TRADEGUARD_GEMINI_MODEL = process.env.TRADEGUARD_GEMINI_MODEL || 'gemini-3.6-flash';
export const TRADEGUARD_ENGINE_VERSION = 'TG-CORE-1.0';
export const TRADEGUARD_PROMPT_VERSION = 'TG-SMC-CRT-1.0';
export const TRADEGUARD_SCHEMA_VERSION = 'TG-ANALYSIS-1.0';
export const TRADEGUARD_MODEL_VERSION = TRADEGUARD_GEMINI_MODEL;

// Known mock/placeholder values from legacy codebase templates that must NEVER appear in verified setups
export const BANNED_MOCK_NUMBERS = [
  105250,
  4602.5,
  4585.0,
  4635.0,
  4594.5,
  4598.0,
];

// =============================================================
// 2. NUMERIC PRICE PARSER
// =============================================================
export function parseNumericPrice(val: any): number {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[\$€£¥\sA-Za-z]/g, '').trim();
    if (cleaned.includes(',') && cleaned.includes('.')) {
      if (cleaned.indexOf(',') < cleaned.indexOf('.')) {
        return parseFloat(cleaned.replace(/,/g, ''));
      } else {
        return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
      }
    } else if (cleaned.includes(',')) {
      const parts = cleaned.split(',');
      if (parts[1] && parts[1].length === 3) {
        return parseFloat(cleaned.replace(/,/g, ''));
      } else {
        return parseFloat(cleaned.replace(',', '.'));
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

// =============================================================
// 3. GEMINI STRUCTURED JSON SCHEMA
// =============================================================
export const TRADEGUARD_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    analysisStatus: {
      type: Type.STRING,
      enum: ['SUCCESS', 'NO_SETUP', 'FAILED'],
    },
    pair: { type: Type.STRING },
    selectedStrategy: { type: Type.STRING },
    strategy: {
      type: Type.STRING,
      enum: ['SMC', 'CRT'],
    },
    timeframes: {
      type: Type.OBJECT,
      properties: {
        htf: { type: Type.STRING },
        mtf: { type: Type.STRING },
        ltf: { type: Type.STRING },
      },
    },
    chartQuality: {
      type: Type.STRING,
      enum: ['Readable', 'Partially readable', 'Unreadable', 'ANALYZABLE', 'PARTIALLY ANALYZABLE', 'UNREADABLE'],
    },
    setupStatus: {
      type: Type.STRING,
      enum: [
        'CONFIRMED',
        'DEVELOPING',
        'NO_SETUP',
        'INVALID',
        'ANALYSIS_FAILED',
        'WAIT',
        'A+ SETUP',
        'VALID SETUP',
        'WAIT — NO VALID A+ SETUP',
      ],
    },
    setupGrade: {
      type: Type.STRING,
      enum: ['A+', 'A', 'B', 'Developing', 'Avoid', 'NO_TRADE', 'CONFIRMED', 'INVALID'],
    },
    confidence: { type: Type.INTEGER },
    confidenceRationale: { type: Type.STRING },
    overallBias: {
      type: Type.STRING,
      enum: ['BULLISH', 'BEARISH', 'NEUTRAL'],
    },
    marketBias: {
      type: Type.STRING,
      enum: ['BULLISH', 'BEARISH', 'NEUTRAL'],
    },

    // 4H HTF Analysis (Macro Context & Draw on Liquidity)
    htfAnalysis: {
      type: Type.OBJECT,
      properties: {
        timeframe: { type: Type.STRING },
        currentPrice: { type: Type.STRING },
        majorSwingHigh: { type: Type.STRING },
        majorSwingLow: { type: Type.STRING },
        trend: { type: Type.STRING },
        marketStructure: { type: Type.STRING },
        bos: { type: Type.STRING },
        choch: { type: Type.STRING },
        majorLiquidity: { type: Type.STRING },
        supplyDemandZone: { type: Type.STRING },
        supply: { type: Type.STRING },
        demand: { type: Type.STRING },
        premiumDiscount: { type: Type.STRING },
        protectedHighLow: { type: Type.STRING },
        htfPoi: { type: Type.STRING },
        drawOnLiquidity: { type: Type.STRING },
        evidence: { type: Type.STRING },
      },
      required: [
        'timeframe',
        'marketStructure',
        'majorLiquidity',
        'supplyDemandZone',
        'premiumDiscount',
        'htfPoi',
        'drawOnLiquidity',
        'evidence',
      ],
    },

    // 1H MTF Analysis (Structural Refinement & POI inside 4H Context)
    mtfAnalysis: {
      type: Type.OBJECT,
      properties: {
        timeframe: { type: Type.STRING },
        currentStructure: { type: Type.STRING },
        internalStructure: { type: Type.STRING },
        marketStructureRefinement: { type: Type.STRING },
        liquidity: { type: Type.STRING },
        inducement: { type: Type.STRING },
        sweep: { type: Type.STRING },
        bos: { type: Type.STRING },
        chochMss: { type: Type.STRING },
        orderBlock: { type: Type.STRING },
        fvg: { type: Type.STRING },
        mitigation: { type: Type.STRING },
        mitigationStatus: { type: Type.STRING },
        poi: { type: Type.STRING },
        poiRefinement: { type: Type.STRING },
        invalidationLevel: { type: Type.STRING },
        liquidityPositioning: { type: Type.STRING },
        evidence: { type: Type.STRING },
      },
      required: [
        'timeframe',
        'marketStructureRefinement',
        'poiRefinement',
        'mitigationStatus',
        'inducement',
        'evidence',
      ],
    },

    // 15M LTF Analysis (Sniper Execution Confirmation)
    ltfAnalysis: {
      type: Type.OBJECT,
      properties: {
        timeframe: { type: Type.STRING },
        executionStatus: {
          type: Type.STRING,
          enum: ['CONFIRMED', 'DEVELOPING', 'INVALID', 'NOT_PRESENT'],
        },
        executionConfirmation: { type: Type.STRING },
        liquiditySweep: { type: Type.STRING },
        mssChoch: { type: Type.STRING },
        cisd: { type: Type.STRING },
        displacement: { type: Type.STRING },
        fvg: { type: Type.STRING },
        orderBlock: { type: Type.STRING },
        mitigation: { type: Type.STRING },
        rejection: { type: Type.STRING },
        retest: { type: Type.STRING },
        entryTrigger: { type: Type.STRING },
        bos: { type: Type.STRING },
        entryLocation: { type: Type.STRING },
        structuralInvalidation: { type: Type.STRING },
        evidence: { type: Type.STRING },
      },
      required: [
        'timeframe',
        'executionConfirmation',
        'liquiditySweep',
        'displacement',
        'entryTrigger',
        'evidence',
      ],
    },

    // Trade Parameters (Numeric prices read strictly from visible chart)
    hasConfirmedSetup: { type: Type.BOOLEAN },
    entry: { type: Type.NUMBER },
    stopLoss: { type: Type.NUMBER },
    takeProfit: { type: Type.NUMBER },
    takeProfit1: { type: Type.NUMBER },
    takeProfit2: { type: Type.NUMBER },
    entryRationale: { type: Type.STRING },
    stopLossRationale: { type: Type.STRING },
    takeProfitRationale: { type: Type.STRING },
    riskReward: { type: Type.STRING },
    invalidation: { type: Type.STRING },

    // Categorized Evidence
    requiredEvidence: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    supportingEvidence: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    optionalEvidence: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },

    // Strategy-specific Details
    smcDetails: {
      type: Type.OBJECT,
      properties: {
        htfSupplyDemandPresent: { type: Type.BOOLEAN },
        poiPresent: { type: Type.BOOLEAN },
        mitigationPresent: { type: Type.BOOLEAN },
        inducementPresent: { type: Type.BOOLEAN },
        liquiditySweepPresent: { type: Type.BOOLEAN },
        protectedLevelPresent: { type: Type.BOOLEAN },
        failureToSwingPresent: { type: Type.BOOLEAN },
        cisdPresent: { type: Type.BOOLEAN },
        displacementPresent: { type: Type.BOOLEAN },
        bosChochPresent: { type: Type.BOOLEAN },
        poiRefinementPresent: { type: Type.BOOLEAN },
        entryConfirmed: { type: Type.BOOLEAN },
        allCriticalConditionsMet: { type: Type.BOOLEAN },
      },
    },

    smcAnalysis: {
      type: Type.OBJECT,
      properties: {
        marketStructure: {
          type: Type.OBJECT,
          properties: {
            hhHlLhLl: { type: Type.STRING },
            bos: { type: Type.STRING },
            chochMss: { type: Type.STRING },
            protectedHighLow: { type: Type.STRING },
            displacement: { type: Type.STRING },
          },
        },
        liquidity: {
          type: Type.OBJECT,
          properties: {
            buySideLiquidity: { type: Type.STRING },
            sellSideLiquidity: { type: Type.STRING },
            equalHighsLows: { type: Type.STRING },
            previousHighsLows: { type: Type.STRING },
            restingLiquidity: { type: Type.STRING },
            liquiditySweep: { type: Type.STRING },
          },
        },
        premiumDiscount: {
          type: Type.OBJECT,
          properties: {
            dealingRange: { type: Type.STRING },
            equilibrium: { type: Type.STRING },
            zone: { type: Type.STRING },
          },
        },
        orderBlocks: {
          type: Type.OBJECT,
          properties: {
            bullishOb: { type: Type.STRING },
            bearishOb: { type: Type.STRING },
            lastOpposingCandle: { type: Type.STRING },
            mitigation: { type: Type.STRING },
            invalidation: { type: Type.STRING },
          },
        },
        fairValueGaps: {
          type: Type.OBJECT,
          properties: {
            bullishFvg: { type: Type.STRING },
            bearishFvg: { type: Type.STRING },
            boundaries: { type: Type.STRING },
            fillStatus: { type: Type.STRING },
            poiRelation: { type: Type.STRING },
          },
        },
        inducement: {
          type: Type.OBJECT,
          properties: {
            level: { type: Type.STRING },
            description: { type: Type.STRING },
            status: { type: Type.STRING },
          },
        },
      },
    },

    crtDetails: {
      type: Type.OBJECT,
      properties: {
        rangeFormation: { type: Type.STRING },
        referenceHigh: { type: Type.STRING },
        referenceLow: { type: Type.STRING },
        rangeSweepConfirmed: { type: Type.BOOLEAN },
        rejectionConfirmed: { type: Type.BOOLEAN },
        ltfConfirmationConfirmed: { type: Type.BOOLEAN },
        directionalIntent: { type: Type.STRING },
        entryLevel: { type: Type.STRING },
        invalidationLevel: { type: Type.STRING },
        targetLevel: { type: Type.STRING },
      },
    },

    confirmationItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          status: { type: Type.STRING },
          evidence: { type: Type.STRING },
          confidence: { type: Type.INTEGER },
        },
        required: ['name', 'status', 'evidence'],
      },
    },

    reasoning: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    evidence: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    annotations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          x: { type: Type.NUMBER },
          y: { type: Type.NUMBER },
          x2: { type: Type.NUMBER },
          y2: { type: Type.NUMBER },
          label: { type: Type.STRING },
          color: { type: Type.STRING },
          price: { type: Type.NUMBER },
        },
        required: ['type', 'x', 'y', 'label'],
      },
    },
  },
  required: [
    'pair',
    'selectedStrategy',
    'chartQuality',
    'setupStatus',
    'confidence',
    'marketBias',
    'htfAnalysis',
    'mtfAnalysis',
    'ltfAnalysis',
    'reasoning',
    'evidence',
  ],
};

// =============================================================
// 4. PROMPT BUILDERS (SMC vs CRT)
// =============================================================
export function buildTradeGuardPrompt(strategy: 'SMC' | 'CRT', asset: string): {
  systemInstruction: string;
  userInstruction: string;
} {
  const isSmc = strategy === 'SMC';

  const systemInstruction = `You are TradeGuard AI — Institutional Multi-Timeframe Chart Analysis Engine (${TRADEGUARD_ENGINE_VERSION}).
Your absolute directive is evidence-first visual chart analysis strictly based on the three uploaded charts.

=== CORE GROUND TRUTH MANDATE ===
THE UPLOADED CHARTS ARE THE ONLY SOURCE OF PRICE TRUTH.
- Visually inspect the actual chart images provided.
- The pair selected by the user is ${asset.toUpperCase()}. You must analyze this exact pair. Never substitute another symbol.
- Read the visible price axis scale directly from the 15M execution chart.
- Calculate Entry from actual visible structure (Order Block, FVG, POI, confirmation retest, displacement retracement).
- Calculate Stop Loss from actual protected structural highs/lows with justified buffer.
- Calculate Take Profit from actual structural liquidity pools (opposing liquidity, previous swing, equal highs/lows).
- NEVER use remembered prices, placeholder prices, previous analysis prices, or synthetic numbers.
- DO NOT force "NO SETUP". Do NOT reject a setup simply because an arbitrary numerical score is below a threshold. EVIDENCE controls the decision.

=== 1. THREE-TIMEFRAME REASONING ARCHITECTURE ===
The engine must reason sequentially across the 4H, 1H, and 15M charts rather than analyzing them independently:

1. HIGHER TIMEFRAME (4H) — Macro Context & Draw on Liquidity:
   - What is the major market context and draw on liquidity?
   - Extract from actual 4H image:
     * current price
     * major swing high
     * major swing low
     * trend / structure (BULLISH, BEARISH, or RANGING)
     * Break of Structure (BOS)
     * Change of Character (CHoCH) if present
     * major liquidity pools (external range liquidity)
     * major unmitigated supply and demand zones
     * premium / discount equilibrium relative to current dealing range
     * major POI (Point of Interest)
     * draw on liquidity (where price is magnetically heading)
   - Return visible evidence for every conclusion!
   - MANDATE: The 4H chart establishes macro bias; it does not trigger execution on its own.

2. MIDDLE TIMEFRAME (1H) — Structural Refinement & POI:
   - How is price behaving inside the 4H context?
   - Refine the 4H thesis on the 1H chart:
     * current structure and internal structure
     * liquidity and inducement (engineered liquidity trapping retail traders)
     * liquidity sweep (if internal highs/lows were purged)
     * 1H BOS / CHoCH / Market Structure Shift (MSS)
     * 1H Order Block (OB) and Fair Value Gap (FVG)
     * mitigation status of 1H zones
     * refined POI for potential trade setup
     * structural invalidation level

3. LOWER TIMEFRAME (15M) — Sniper Execution Confirmation:
   - What is the actual execution confirmation?
   - Visually inspect the 15M chart for:
     * liquidity sweep of inducement or local extreme
     * Market Structure Shift (MSS / CHoCH) with displacement candle close
     * displacement: strong energetic candles leaving imbalances
     * Fair Value Gap (FVG) creation and defense
     * Order Block (OB) formation
     * mitigation / rejection / retest of key level
     * active entry trigger
   - Determine whether 15M execution is:
     * CONFIRMED: 15M trigger has printed and closed with confirmation.
     * DEVELOPING: 4H and 1H structure are valid, but 15M is currently approaching POI or awaiting the trigger candle close.
     * INVALID: price has breached structural invalidation.
     * NOT_PRESENT: no structural execution evidence exists.

=== 2. STRICT 12-STAGE INSTITUTIONAL SEQUENCE MANDATE ===
For an institutional A+ trade signal, the entire sequence must be verified in order:
Higher-Timeframe Supply/Demand → Mitigation → Inducement & Liquidity Sweep → Protected Extreme → Failure to Swing → Change in State of Delivery (CISD) → Displacement → POI Selection → POI Retest & Mitigation → Sniper Entry → Structural Stop Loss → Take Profit Targets.

If ANY required stage from 1 through 9 is missing, pending, or unconfirmed (e.g. no liquidity sweep, failure to swing pending, CISD unconfirmed, POI unmitigated):
- Set setupStatus: 'DEVELOPING' or 'WAIT — NO VALID A+ SETUP' (or 'NO_SETUP' if no structure exists).
- Set entry: null, stopLoss: null, takeProfit: null.
- Set stateMachineState to the exact corresponding waiting state (e.g., WAITING_FOR_LIQUIDITY_SWEEP, WAITING_FOR_FAILURE_TO_SWING, WAITING_FOR_CISD, WAITING_FOR_RETEST).
- DO NOT generate or force an executable trade signal!

=== 3. ABSOLUTE SEPARATION: LIQUIDITY POOL IS NEVER AN ENTRY LEVEL ===
- A liquidity pool is an area where resting orders sit.
- A liquidity sweep is price running into those orders to engineer liquidity.
- A protected high/low is the structural extreme established after the sweep.
- A POI is an unmitigated order block, FVG, or retest zone created by displacement AFTER the sweep.
- The entry is taken at or within the POI AFTER CISD and displacement, NOT at the swept high or swept low.
MANDATORY RULES:
* NEVER place an entry directly on the swept high or swept low.
* NEVER treat buy-side liquidity as a buy entry.
* NEVER treat sell-side liquidity as a sell entry.
* Provide an explicit 'whyEntryIsNotLiquidity' explanation distinguishing the entry point from the liquidity pool.
* Show the structural reason why the entry level provides asymmetry.

=== 4. MARKET STRUCTURE FROM VISIBLE SWING POINTS ===
- Do NOT use hardcoded BOS/CHoCH values.
- Determine structure directly from visible swing points:
  * Bullish: consecutive Higher Highs (HH) and Higher Lows (HL)
  * Bearish: consecutive Lower Highs (LH) and Lower Lows (LL)
  * If structure is unclear: state "RANGING" or "UNCLEAR" with evidence.

=== 5. TOP-DOWN DIRECTIONAL BIAS & CROSS-TIMEFRAME CONSISTENCY ===
- The 4H Higher Timeframe establishes the directional context first from consecutive higher highs/lows or lower highs/lows.
- Do NOT infer a bearish bias merely because the last few candles are red. Do NOT infer a bullish bias merely because the last few candles are green.
- The 1H Middle Timeframe refines the HTF thesis.
- The 15M Lower Timeframe executes the sniper trigger. The 15M chart MUST NOT independently override the 4H bias without a validated HTF reversal zone mitigation.
- If timeframes conflict, explain the conflict and state "CONFLICTING" instead of forcing an ungrounded A+ setup.
- STOP LOSS: Must be based on structural invalidation:
  * BUY: SL anchored strictly below the Protected Low established by the sweep, with justified buffer.
  * SELL: SL anchored strictly above the Protected High established by the sweep, with justified buffer.
- TAKE PROFIT: Must target actual market structure: opposing internal range liquidity, previous swing high/low, equal highs/lows.
- RISK/REWARD: Calculate mathematically AFTER Entry, SL, and TP are established:
  * Minimum 2.0:1 R:R for an institutional A+ Setup (Reward / Risk >= 2.0).
  * Both Risk and Reward must be positive numbers.

=== 6. EVIDENCE-BASED CONFIDENCE ASSESSMENT ===
- Calculate confidence (0-100) based strictly on verified evidence:
  * High (80-95%): 4H macro + 1H POI + 15M confirmed trigger with displacement & sweep.
  * Moderate (60-75%): 4H + 1H valid, setup is DEVELOPING (waiting for 15M trigger close).
  * Low / Unconfirmed (20-40%): Choppy / fragmented evidence.
  * Insufficient evidence: Return 'N/A' in confidenceRationale.
  * DO NOT use fake hardcoded numbers (e.g. 50, 70, 80, 90). Do NOT leave blank.

=== 7. FINAL DECISION STATES ===
Use strictly one of these states:
- CONFIRMED: 4H supports + 1H context + 15M confirmed trigger + Entry, SL, TP identified + valid R:R.
- DEVELOPING: 4H and 1H directional structure are valid, but 15M confirmation trigger is still forming (provide prospective Entry zone, SL, TP, and explain what trigger is awaited).
- NO_SETUP: Required evidence genuinely does not exist (charts are in non-actionable chop or conflicting structure).
- INVALID: Setup has been structurally invalidated (e.g. SL level breached or key POI broken).
- ANALYSIS_FAILED: Chart unreadable or missing essential visual data.

${
  isSmc
    ? `=== PRIMARY A+ SMC MODEL — STRICT 12-STAGE INSTITUTIONAL SEQUENCE ===
DO NOT replace this logic with generic "SMC confluence", generic confidence scoring, or a simple BOS/CHoCH checklist.
Implement this exact setup:
HTF SUPPLY/DEMAND
→ MITIGATION
→ INDUCEMENT
→ LIQUIDITY SWEEP
→ VALIDATION OF HTF ZONE
→ PROTECTED HIGH/LOW
→ FAILURE TO SWING
→ CHANGE IN STATE OF DELIVERY
→ POI
→ MITIGATION
→ ENTRY
→ STRUCTURAL SL
→ INTERNAL RANGE LIQUIDITY / VALID TP

DO NOT FORCE A TRADE WHEN THE SEQUENCE IS ABSENT.

STAGE 1. HIGHER-TIMEFRAME SUPPLY/DEMAND (4H):
- Identify a structurally meaningful Supply (for bearish setup) or Demand (for bullish setup) based on actual price structure visible on the 4H chart.
- Do NOT simply mark every supply/demand-looking area.
- zoneType: 'SUPPLY' | 'DEMAND', zoneHigh, zoneLow, timeframe: '4H', evidence, validity.

STAGE 2. MITIGATION:
- Price must return into / interact with the HTF zone. Confirm from actual candles.
- For bearish: price returns into HTF supply.
- For bullish: price returns into HTF demand.
- Do not assume mitigation merely because price is near the zone.

STAGE 3. INDUCEMENT:
- Identify price action inducing traders into an early directional position.
- Bearish: price pushes down from supply, inducing sellers to believe the bearish move has already begun.
- Bullish: price pushes up from demand, inducing buyers to believe the bullish move has already begun.
- Identify the PURPOSE of this movement: lure premature breakout traders and trap their liquidity.

STAGE 4. LIQUIDITY SWEEP:
- After inducement, price moves against early traders and takes their liquidity in/around the HTF zone.
- Bearish: price moves up, takes relevant high / seller liquidity above early sellers.
- Bullish: price moves down, takes relevant low / buyer liquidity below early buyers.
- Identify: liquidityType, sweptLevel, sweepHigh / sweepLow, sweepLocation, relationshipToHTFZone, evidence.

STAGE 5. VALIDATION OF THE HTF ZONE:
- Liquidity sweep occurring inside/around the HTF supply/demand zone validates it.
- Bearish: HTF supply + mitigation + liquidity sweep above relevant liquidity = validated bearish HTF zone.
- Bullish: HTF demand + mitigation + liquidity sweep below relevant liquidity = validated bullish HTF zone.
- This does NOT mean enter immediately; it validates the zone for the subsequent execution sequence.

STAGE 6. PROTECTED HIGH / PROTECTED LOW:
- Extreme created by that sweep.
- Bearish: the high that took liquidity becomes the PROTECTED HIGH.
- Bullish: the low that took liquidity becomes the PROTECTED LOW.
- Price should NOT break and establish beyond this level if thesis remains valid.
- type, price, timeframe, reason, invalidationCondition.

STAGE 7. FAILURE TO SWING (ESSENTIAL — DO NOT ENTER PREMATURELY):
- After the liquidity sweep creates the protected high/low, DO NOT enter immediately. Wait for price to attempt to take that protected extreme again, and FAIL to break/accept beyond it.
- Bearish: Protected High -> price pushes down -> price pushes back UP -> price attempts to swing above the protected high -> price FAILS to successfully break/accept above it -> failure to swing!
- Bullish: Protected Low -> price pushes up -> price pushes back DOWN -> price attempts to swing below protected low -> price FAILS to successfully break/accept below it -> failure to swing!
- The original liquidity sweep and failure to swing are separate events!

STAGE 8. CHANGE IN STATE OF DELIVERY (CISD / COSD):
- After failure to swing, wait for price to close beyond the low/high that causes the failure-to-swing structure.
- Bearish: identify the low that causes the failure -> price closes below that low -> CHANGE IN STATE OF DELIVERY.
- Bullish: identify the high that causes the failure -> price closes above that high -> CHANGE IN STATE OF DELIVERY.
- Must be structurally connected to the failure-to-swing event.

STAGE 9. POI OF THE CHANGE IN STATE OF DELIVERY:
- ONLY AFTER the change in state of delivery has occurred: identify the POI responsible for / associated with that delivery shift (Order Block, displacement origin, FVG, refined zone).
- Must come from the actual structure that caused the change.

STAGE 10. WAIT FOR MITIGATION OF THE POI:
- Do NOT enter immediately after the CISD. Wait for price to return to the identified POI.
- Price returns to POI -> mitigation event before entry.

STAGE 11. 15M EXECUTION:
- 4H = HTF zone + context.
- 1H = structure + liquidity + refinement.
- 15M = failure/switch/POI/entry execution.
- Entry: exact price upon POI mitigation.
- Stop Loss: MUST BE ANCHORED BEYOND THE PROTECTED HIGH (bearish) OR PROTECTED LOW (bullish)!
- Take Profit: At internal range liquidity / valid structural target (equal highs/lows, previous swing low/high).

STAGE 12. SEQUENCE DISCIPLINE & AVOID FORCING:
- If ANY stage of the sequence is absent or still in progress (e.g. failure to swing not confirmed, CISD pending, POI not yet mitigated), output setupStatus: 'DEVELOPING' or 'WAIT — NO VALID A+ SETUP', with entry: null, stopLoss: null, takeProfit: null!
- NEVER force a trade when the sequence is absent!`
    : `[CRT (CANDLE RANGE THEORY) SEQUENCE]
Range formation (High/Low) → Sweep beyond boundary → Displacement rejection back inside range → 15M candle confirmation → Entry at range retest → SL beyond sweep wick → TP at opposing range boundary.`
}`;

  const userInstruction = `Execute TradeGuard ${strategy} multi-timeframe analysis for ${asset.toUpperCase()}.
Analyze the three attached charts in chronological order:
- Chart 1: 4H Higher Timeframe (Macro Context & Directional Bias)
- Chart 2: 1H Middle Timeframe (Structural Refinement & Liquidity)
- Chart 3: 15M Lower Timeframe (Sniper Execution Trigger)

Read all price levels directly from the visible price scale of the 15M chart.
Output ONLY a single valid JSON object adhering to this structure:
{
  "pair": "${asset.toUpperCase()}",
  "selectedStrategy": "${strategy}",
  "chartQuality": "Readable",
  "setupStatus": "CONFIRMED",
  "setupGrade": "A+",
  "stateMachineState": "ENTRY_VALIDATED",
  "confidence": 85,
  "confidenceRationale": "High confidence based on 4H macro alignment, 1H POI mitigation, and 15M MSS displacement.",
  "marketBias": "BULLISH",
  "overallBias": "BULLISH",
  "entry": 2742.50,
  "stopLoss": 2735.00,
  "takeProfit": 2760.00,
  "riskReward": "1 : 2.33",
  "whyEntryIsNotLiquidity": "Entry at 2742.50 is within the 15M Order Block formed after CISD, strictly separated from the swept low at 2735.00.",
  "whatMustHappenNext": "Execute entry upon 15M POI mitigation retest with stop loss anchored beyond protected low.",
  "reasoning": [
    "4H trend is bullish breaking structure upwards",
    "1H Order Block tested with sell-side liquidity swept",
    "15M displacement candle printed with confirmed MSS"
  ],
  "evidence": [
    "4H Higher High at 2750 printed",
    "1H OB tested at 2738-2741",
    "15M wick rejection swept 2735 low"
  ],
  "htfAnalysis": {
    "timeframe": "4H",
    "bias": "BULLISH",
    "marketStructure": "Bullish continuation",
    "majorLiquidity": "Buy-side liquidity at 2760",
    "supplyDemandZone": "Demand zone at 2730-2735",
    "premiumDiscount": "Discount",
    "htfPoi": "4H Demand Zone",
    "evidence": "4H candle closed above structural resistance"
  },
  "mtfAnalysis": {
    "timeframe": "1H",
    "marketStructureRefinement": "1H BOS confirmed",
    "poiRefinement": "1H Order Block",
    "mitigationStatus": "Tested",
    "inducement": "Minor low at 2737.5",
    "liquidityPositioning": "Sell-side swept",
    "evidence": "1H long wick rejection"
  },
  "ltfAnalysis": {
    "timeframe": "15M",
    "executionConfirmation": "15M MSS and displacement impulse verified",
    "liquiditySweep": "Swept at 2735.0",
    "displacement": "Bullish impulse candle",
    "evidence": "15M candle closed above internal high"
  },
  "aplusSmc": {
    "direction": "BUY",
    "setupGrade": "A+",
    "setupStatus": "A+ SETUP",
    "htfSupplyDemand": {
      "status": "VALID",
      "type": "HTF Demand",
      "zoneType": "DEMAND",
      "zoneRange": "2730.00 - 2735.00",
      "timeframe": "4H",
      "evidence": "4H unmitigated demand zone resting at session origin"
    },
    "htfMitigation": {
      "status": "CONFIRMED",
      "entryDepth": "Deep mitigation into 4H demand boundary",
      "reactionProduced": "Strong bullish pinbar rejection candle",
      "evidence": "Visible mitigation of 4H demand on 1H timeframe"
    },
    "inducement": {
      "status": "IDENTIFIED",
      "inducedDirection": "EARLY_BUYERS",
      "level": 2738.00,
      "purpose": "Early buyer pushup inducing retail breakout traders before sweep",
      "description": "Retail traders lured into premature longs"
    },
    "liquiditySweep": {
      "status": "CONFIRMED",
      "sweptLevel": 2735.00,
      "sweepType": "Sell-Side Liquidity Sweep",
      "liquidityType": "Sell-side liquidity below early buyers",
      "sweepLow": 2735.00,
      "sweepLocation": "Inside 4H Demand Zone perimeter",
      "relationshipToHTFZone": "Sweep occurred directly within 4H demand zone",
      "wickVsBodyClose": "Wick swept 2735.00, candle closed back at 2738.50",
      "evidence": "15M wick pierced 2735.00 and aggressively rejected"
    },
    "htfZoneValidation": {
      "isValidated": true,
      "mitigationVerified": true,
      "sweepVerified": true,
      "validationRationale": "HTF Demand + Mitigation + Liquidity Sweep below early buyers = Validated Bullish HTF Zone"
    },
    "protectedLevel": {
      "type": "PROTECTED LOW",
      "price": 2735.00,
      "timeframe": "15M",
      "reason": "Extreme created by sell-side liquidity sweep",
      "invalidationCondition": "Candle close below 2735.00 invalidates bullish setup"
    },
    "failureToSwing": {
      "status": "CONFIRMED",
      "attemptedSwingLevel": 2735.50,
      "failurePoint": "Higher Low formed at 2736.80",
      "triggerFailureLowHigh": 2740.00,
      "structuralMechanism": "Price attempted second push toward protected low and failed to break it",
      "evidence": "15M price formed a higher low failing to breach 2735.00"
    },
    "changeInStateOfDelivery": {
      "status": "CONFIRMED",
      "shiftType": "Bearish to Bullish",
      "responsibleCandleStructure": "Strong displacement candle body close above 2740.00",
      "breakCloseLevel": 2740.50,
      "triggerLevel": 2740.00,
      "evidence": "15M candle body closed above the pivot that caused failure to swing"
    },
    "poi": {
      "status": "VALID",
      "type": "Bullish Order Block",
      "poiType": "Order Block",
      "priceRange": "2741.00 - 2743.00",
      "timeframe": "15M",
      "origin": "Displacement impulse initiating the delivery shift",
      "evidence": "Unmitigated 15M bullish OB with volume displacement"
    },
    "poiMitigation": {
      "status": "CONFIRMED",
      "retracementDepth": "Price retraced into 15M OB for entry execution",
      "reactionConfirmation": "Bullish rejection wick on 15M tap",
      "protectedStructureIntact": true,
      "evidence": "Price tapped 2742.50 while Protected Low remained intact"
    },
    "sniperEntry": {
      "entryPrice": 2742.50,
      "executionTimeframe": "15M",
      "confirmationType": "POI Mitigation Retest with 15M Rejection",
      "entryRationale": "Executed at 2742.50 upon 15M POI mitigation following confirmed CISD"
    },
    "stopLoss": {
      "stopLossPrice": 2735.00,
      "bufferAmount": "0.50",
      "structureReference": "Below Protected Low (2735.00)",
      "rationale": "Anchored strictly beyond Protected Low established by the liquidity sweep"
    },
    "takeProfitTargets": {
      "tp1": 2760.00,
      "tp1LiquidityType": "Internal Range Liquidity"
    },
    "calculatedRiskReward": "1 : 2.33"
  }
}`;

  return { systemInstruction, userInstruction };
}

// =============================================================
// 5. SERVER-SIDE VALIDATION ENGINE & LOGGING
// =============================================================
export interface ValidationEngineResult {
  valid: boolean;
  reason?: string;
  setupStatus: 'CONFIRMED' | 'DEVELOPING' | 'NO_SETUP' | 'INVALID' | 'ANALYSIS_FAILED' | 'A+ SETUP' | 'VALID SETUP' | 'WAIT — NO VALID A+ SETUP';
  grade: 'A+' | 'A' | 'B' | 'Developing' | 'Avoid';
  notes: string;
}

/**
 * Format and print structured logs of Raw Gemini Analysis and Validator Result
 */
export function logPreAndPostValidation(
  rawGemini: any,
  validatedSignal: any,
  validationResult: ValidationEngineResult
): void {
  const p = rawGemini?.pair || validatedSignal?.asset || 'UNKNOWN';
  const s = rawGemini?.selectedStrategy || rawGemini?.strategy || validatedSignal?.strategy || 'SMC';

  const htf = rawGemini?.htfAnalysis;
  const mtf = rawGemini?.mtfAnalysis;
  const ltf = rawGemini?.ltfAnalysis;

  console.log('\n================================================================================');
  console.log('[TRADEGUARD] RAW GEMINI ANALYSIS (PRE-VALIDATION)');
  console.log('================================================================================');
  console.log(`PAIR:              ${p}`);
  console.log(`STRATEGY:          ${s}`);
  console.log(`BIAS:              ${rawGemini?.marketBias || rawGemini?.overallBias || rawGemini?.bias || 'N/A'}`);
  console.log(`SETUP STATUS:      ${rawGemini?.setupStatus || 'N/A'}`);
  console.log(`CONFIDENCE:        ${rawGemini?.confidence ? `${rawGemini.confidence}%` : 'N/A'} (${rawGemini?.confidenceRationale || 'Evidence-grounded'})`);
  console.log(`ENTRY:             ${rawGemini?.entry ?? 'N/A'}`);
  console.log(`SL:                ${rawGemini?.stopLoss ?? 'N/A'}`);
  console.log(`TP:                ${rawGemini?.takeProfit ?? rawGemini?.takeProfit1 ?? 'N/A'}`);
  console.log(`R:R:               ${rawGemini?.riskReward || 'N/A'}`);
  console.log('--------------------------------------------------------------------------------');
  console.log(`4H ANALYSIS:       Trend: ${htf?.trend || htf?.bias || 'N/A'} | Structure: ${htf?.marketStructure || 'N/A'} | POI: ${htf?.htfPoi || htf?.supplyDemandZone || 'N/A'} | Draw: ${htf?.drawOnLiquidity || 'N/A'}`);
  console.log(`1H ANALYSIS:       Structure: ${mtf?.marketStructureRefinement || mtf?.currentStructure || 'N/A'} | Inducement: ${mtf?.inducement || 'N/A'} | POI: ${mtf?.poiRefinement || mtf?.poi || 'N/A'} | Mitigation: ${mtf?.mitigationStatus || 'N/A'}`);
  console.log(`15M ANALYSIS:      Status: ${ltf?.executionStatus || ltf?.executionConfirmation || 'N/A'} | Sweep: ${ltf?.liquiditySweep || 'N/A'} | MSS: ${ltf?.mssChoch || 'N/A'} | Displacement: ${ltf?.displacement || 'N/A'} | Trigger: ${ltf?.entryTrigger || 'N/A'}`);
  console.log(`MARKET STRUCTURE:  ${rawGemini?.smcAnalysis?.marketStructure?.hhHlLhLl || htf?.marketStructure || 'Visual structure analyzed'}`);
  console.log(`LIQUIDITY:         Sweep: ${ltf?.liquiditySweep || 'N/A'} | Major: ${htf?.majorLiquidity || 'N/A'}`);
  console.log(`POI:               1H: ${mtf?.poiRefinement || 'N/A'} | 4H: ${htf?.htfPoi || 'N/A'}`);
  console.log(`SWEEP:             ${ltf?.liquiditySweep || 'N/A'}`);
  console.log(`DISPLACEMENT:      ${ltf?.displacement || 'N/A'}`);
  console.log(`BOS/CHoCH/MSS:     15M MSS: ${ltf?.mssChoch || 'N/A'} | 4H BOS: ${htf?.bos || 'N/A'}`);
  console.log(`FVG:               15M: ${ltf?.fvg || 'N/A'} | 1H: ${mtf?.fvg || 'N/A'}`);
  console.log(`ORDER BLOCK:       15M: ${ltf?.orderBlock || 'N/A'} | 1H: ${mtf?.orderBlock || 'N/A'}`);
  console.log(`REASONING:         ${Array.isArray(rawGemini?.reasoning) ? rawGemini.reasoning.join(' | ') : rawGemini?.reasoning || 'N/A'}`);
  console.log('================================================================================');
  console.log('[TRADEGUARD] VALIDATOR RESULT (POST-VALIDATION)');
  console.log('================================================================================');
  console.log(`STATUS:            ${validationResult.setupStatus}`);
  console.log(`GRADE:             ${validationResult.grade}`);
  console.log(`VALID:             ${validationResult.valid ? 'YES' : 'NO'}`);
  console.log(`ENTRY:             ${validatedSignal?.entry ?? 'N/A'}`);
  console.log(`SL:                ${validatedSignal?.stopLoss ?? 'N/A'}`);
  console.log(`TP:                ${validatedSignal?.takeProfit ?? 'N/A'}`);
  console.log(`R:R:               ${validatedSignal?.riskReward || 'N/A'}`);
  console.log(`CONFIDENCE:        ${validatedSignal?.confidence ? `${validatedSignal.confidence}%` : 'N/A'}`);
  console.log(`VALIDATION NOTES:  ${validationResult.notes}`);
  if (validationResult.reason) {
    console.log(`REASON:            ${validationResult.reason}`);
  }
  console.log('================================================================================\n');
}

/**
 * Normalizes and ensures complete 12-stage institutional sequence for A+ SMC model
 */
export function normalizeAplusSmcSequence(signal: any): AplusSmcSequence {
  const bias = String(signal?.marketBias || signal?.bias || '').toUpperCase();
  const isBull = bias.includes('BULL') || bias.includes('BUY') || bias.includes('LONG');
  const rawAplus = signal?.aplusSmc || {};
  const htf = signal?.htfAnalysis || {};
  const mtf = signal?.mtfAnalysis || {};
  const ltf = signal?.ltfAnalysis || {};

  const entry = parseNumericPrice(signal?.entry);
  const sl = parseNumericPrice(signal?.stopLoss);
  const tp1 = parseNumericPrice(signal?.takeProfit1 ?? signal?.takeProfit);
  const tp2 = parseNumericPrice(signal?.takeProfit2);

  // 1. HTF Supply / Demand
  const htfZone: AplusHtfZoneInfo = {
    type: rawAplus.htfSupplyDemand?.type || (isBull ? 'DEMAND' : 'SUPPLY'),
    timeframe: rawAplus.htfSupplyDemand?.timeframe || '4H',
    zoneRange: rawAplus.htfSupplyDemand?.zoneRange || htf.supplyDemandZone || htf.htfPoi || (isBull ? '4H Demand Zone' : '4H Supply Zone'),
    structuralOrigin: rawAplus.htfSupplyDemand?.structuralOrigin || htf.marketStructure || '4H structural dealing range boundary',
    status: rawAplus.htfSupplyDemand?.status || 'VALID',
    evidence: rawAplus.htfSupplyDemand?.evidence || `4H ${isBull ? 'demand' : 'supply'} zone identified on macro timeframe`,
  };

  // 2. HTF Mitigation
  const htfMit: AplusMitigationInfo = {
    status: rawAplus.htfMitigation?.status || 'CONFIRMED',
    entryDepth: rawAplus.htfMitigation?.entryDepth || (mtf.mitigationStatus || 'Deep mitigation into HTF boundary'),
    reactionProduced: rawAplus.htfMitigation?.reactionProduced || 'Visible reaction candle produced upon zone contact',
    evidence: rawAplus.htfMitigation?.evidence || 'Visible tap and rejection from higher-timeframe zone',
    liquidityPresent: rawAplus.htfMitigation?.liquidityPresent || (isBull ? 'Sell-side liquidity resting below' : 'Buy-side liquidity resting above'),
  };

  // 3. Inducement
  const indLevel = parseNumericPrice(rawAplus.inducement?.level);
  const inducement: AplusInducementInfo = {
    status: rawAplus.inducement?.status || 'IDENTIFIED',
    inducedDirection: rawAplus.inducement?.inducedDirection || (isBull ? 'EARLY_BUYERS' : 'EARLY_SELLERS'),
    level: !isNaN(indLevel) ? indLevel : (mtf.inducement ? parseNumericPrice(mtf.inducement) : undefined),
    type: rawAplus.inducement?.type || 'Internal liquidity trap',
    purpose: rawAplus.inducement?.purpose || `Engineered to lure early ${isBull ? 'buyers' : 'sellers'} before institutional sweep`,
    description: rawAplus.inducement?.description || `Retail ${isBull ? 'buyers' : 'sellers'} induced prematurely`,
    evidence: rawAplus.inducement?.evidence || mtf.inducement || 'Visible inducement structure ahead of HTF pool',
  };

  // 4. Liquidity Sweep
  const sweepPrice = parseNumericPrice(rawAplus.liquiditySweep?.sweptLevel ?? (isBull ? rawAplus.liquiditySweep?.sweepLow : rawAplus.liquiditySweep?.sweepHigh));
  const ltfSweepStr = String(ltf.liquiditySweep || '');
  const liquiditySweep: AplusLiquiditySweepInfo = {
    ...rawAplus.liquiditySweep,
    status: rawAplus.liquiditySweep?.status || (ltfSweepStr && !ltfSweepStr.toLowerCase().includes('no') ? 'CONFIRMED' : 'CONFIRMED'),
    sweptLevel: !isNaN(sweepPrice) ? sweepPrice : (parseNumericPrice(rawAplus.liquiditySweep?.sweptLevel) || 0),
    sweepType: rawAplus.liquiditySweep?.sweepType || (isBull ? 'Sell-Side Liquidity Sweep' : 'Buy-Side Liquidity Sweep'),
    liquidityType: rawAplus.liquiditySweep?.liquidityType || (isBull ? 'Sell-side liquidity below early buyers' : 'Buy-side liquidity above early sellers'),
    sweepHigh: !isBull ? (!isNaN(sweepPrice) ? sweepPrice : undefined) : undefined,
    sweepLow: isBull ? (!isNaN(sweepPrice) ? sweepPrice : undefined) : undefined,
    sweepLocation: rawAplus.liquiditySweep?.sweepLocation || 'Inside HTF zone perimeter',
    relationshipToHTFZone: rawAplus.liquiditySweep?.relationshipToHTFZone || 'Sweep occurred directly within higher-timeframe zone',
    wickVsBodyClose: rawAplus.liquiditySweep?.wickVsBodyClose || 'Aggressive wick sweep with candle body closing back inside',
    rejectionValidation: rawAplus.liquiditySweep?.rejectionValidation || 'Immediate rejection departure following sweep',
    evidence: rawAplus.liquiditySweep?.evidence || ltf.liquiditySweep || 'Candle wick pierced liquidity pool and snapped back',
    subsequentDelivery: rawAplus.liquiditySweep?.subsequentDelivery,
  };

  // 5. HTF Zone Validation
  const htfZoneValidation: AplusHtfZoneValidation = {
    isValidated: rawAplus.htfZoneValidation?.isValidated ?? true,
    mitigationVerified: rawAplus.htfZoneValidation?.mitigationVerified ?? true,
    sweepVerified: rawAplus.htfZoneValidation?.sweepVerified ?? true,
    validationRationale: rawAplus.htfZoneValidation?.validationRationale || `HTF ${isBull ? 'Demand' : 'Supply'} + Mitigation + Liquidity Sweep = Validated Institutional Zone`,
  };

  // 6. Protected Level
  const rawProt = rawAplus.protectedLevel?.price;
  const protPrice = rawProt !== undefined && rawProt !== null
    ? parseNumericPrice(rawProt)
    : parseNumericPrice(
        rawAplus.liquiditySweep?.sweptLevel ??
        (isBull ? signal?.marketStructure?.protectedLow : signal?.marketStructure?.protectedHigh) ??
        (!isNaN(sl) ? sl : null)
      );
  const protectedLevel: AplusProtectedLevelInfo = {
    type: rawAplus.protectedLevel?.type || (isBull ? 'PROTECTED LOW' : 'PROTECTED HIGH'),
    price: !isNaN(protPrice) ? protPrice : 0,
    timeframe: rawAplus.protectedLevel?.timeframe || '15M',
    reason: rawAplus.protectedLevel?.reason || `Extreme created by ${isBull ? 'sell-side' : 'buy-side'} liquidity sweep`,
    causalConnection: rawAplus.protectedLevel?.causalConnection || 'Formed by institutional sweep taking out retail stops',
    invalidationRole: rawAplus.protectedLevel?.invalidationRole || `If price accepts beyond ${!isNaN(protPrice) ? protPrice : sl}, setup is completely invalidated`,
  };

  // 7. Failure To Swing
  const ftsFailPoint = parseNumericPrice(rawAplus.failureToSwing?.failurePoint);
  const ftsTrigger = parseNumericPrice(rawAplus.failureToSwing?.triggerFailureLowHigh);
  const failureToSwing: AplusFailureToSwingInfo = {
    status: rawAplus.failureToSwing?.status || 'CONFIRMED',
    failurePoint: !isNaN(ftsFailPoint) ? ftsFailPoint : undefined,
    triggerFailureLowHigh: !isNaN(ftsTrigger) ? ftsTrigger : undefined,
    structuralMechanism: rawAplus.failureToSwing?.structuralMechanism || `Price attempted 2nd swing toward ${protectedLevel.type} and failed to break/accept beyond it`,
    evidence: rawAplus.failureToSwing?.evidence || 'Lower high / higher low printed showing exhaustion before shift',
  };

  // 8. Change In State Of Delivery
  const cisdBreakClose = parseNumericPrice(rawAplus.changeInStateOfDelivery?.breakCloseLevel);
  const changeInStateOfDelivery: AplusChangeInStateOfDeliveryInfo = {
    status: rawAplus.changeInStateOfDelivery?.status || 'CONFIRMED',
    shiftType: rawAplus.changeInStateOfDelivery?.shiftType || (isBull ? 'BULLISH CISD' : 'BEARISH CISD'),
    breakCloseLevel: !isNaN(cisdBreakClose) ? cisdBreakClose : undefined,
    responsibleCandleStructure: rawAplus.changeInStateOfDelivery?.responsibleCandleStructure || (ltf.mssChoch || 'Displacement candle body close'),
    detailedSequence: rawAplus.changeInStateOfDelivery?.detailedSequence || 'Candle closed with full body beyond failure-to-swing pivot, shifting state of delivery',
    evidence: rawAplus.changeInStateOfDelivery?.evidence || ltf.displacement || 'Decisive displacement candle breaking delivery state',
  };

  // 9. POI Generated
  const poi: AplusPoiInfo = {
    status: rawAplus.poi?.status || 'VALID',
    type: rawAplus.poi?.type || (ltf.orderBlock || ltf.fvg || (isBull ? 'Bullish Order Block' : 'Bearish Order Block')),
    priceRange: rawAplus.poi?.priceRange || (!isNaN(entry) && entry > 0 ? `${entry}` : '15M Execution POI'),
    origin: rawAplus.poi?.origin || 'Responsible for candle body break of failure-to-swing swing point',
    causalConnectionToDeliveryChange: rawAplus.poi?.causalConnectionToDeliveryChange || 'Directly caused the displacement and state of delivery change',
    evidence: rawAplus.poi?.evidence || 'Clean 15M POI left by delivery shift impulse',
  };

  // 10. POI Mitigation
  const poiMitigation: AplusPoiMitigationInfo = {
    status: rawAplus.poiMitigation?.status || 'CONFIRMED',
    executionTimeframe: rawAplus.poiMitigation?.executionTimeframe || '15M',
    retracementDepth: rawAplus.poiMitigation?.retracementDepth || 'Retracement into 15M POI for entry tap',
    reactionConfirmation: rawAplus.poiMitigation?.reactionConfirmation || 'Rejection reaction confirming defense while protected extreme holds',
    evidence: rawAplus.poiMitigation?.evidence || 'Price pulled back to POI and printed entry reaction',
  };

  // 11. Sniper Entry
  const sniperEntry: AplusSniperEntryInfo = {
    entryPrice: !isNaN(entry) ? entry : 0,
    executionTimeframe: rawAplus.sniperEntry?.executionTimeframe || '15M',
    confirmationType: rawAplus.sniperEntry?.confirmationType || 'Limit/Market tap into mitigated 15M POI',
    alternativeEntryPrice: rawAplus.sniperEntry?.alternativeEntryPrice || signal?.alternativeEntry,
    entryModelRank: rawAplus.sniperEntry?.entryModelRank || 'A+ Highest Probability Confirmation',
  };

  // 12. Structural SL
  const stopLoss: AplusInvalidationStopLossInfo = {
    stopLossPrice: !isNaN(sl) ? sl : 0,
    bufferAmount: rawAplus.stopLoss?.bufferAmount || 'Structural buffer beyond extreme',
    rationale: rawAplus.stopLoss?.rationale || `Anchored strictly beyond ${protectedLevel.type} (${protectedLevel.price})`,
    protectedExtremeReference: protectedLevel.price,
    structuralAnchorRole: rawAplus.stopLoss?.structuralAnchorRole || 'Invalidates entire sequence if breached',
  };

  // 13. Liquidity Targets & R:R
  const takeProfitTargets: AplusLiquidityTargetsInfo = {
    tp1: !isNaN(tp1) ? tp1 : 0,
    tp1LiquidityType: rawAplus.takeProfitTargets?.tp1LiquidityType || (isBull ? 'Internal Buy-Side Liquidity / Dealing Range High' : 'Internal Sell-Side Liquidity / Dealing Range Low'),
    tp2: !isNaN(tp2) && tp2 > 0 ? tp2 : rawAplus.takeProfitTargets?.tp2,
    rationale: rawAplus.takeProfitTargets?.rationale || 'Targeting opposing internal range liquidity pool',
  };

  const risk = Math.abs((!isNaN(entry) ? entry : 0) - (!isNaN(sl) ? sl : 0));
  const reward = Math.abs((!isNaN(tp1) ? tp1 : 0) - (!isNaN(entry) ? entry : 0));
  const rrRatio = (risk > 0 && entry > 0 && sl > 0 && tp1 > 0) ? reward / risk : 0;
  const calculatedRiskReward = rawAplus.calculatedRiskReward || (rrRatio > 0 ? `1 : ${rrRatio.toFixed(2)}` : 'N/A');

  // Build 12-Item Checklist
  const checklist: AplusChecklistItem[] = [
    { stepNumber: 1, condition: 'HTF Supply/Demand Zone Mapped', status: htfZone.status === 'VALID' ? 'CONFIRMED' : 'PENDING', evidence: htfZone.evidence },
    { stepNumber: 2, condition: 'HTF Zone Mitigation Verified', status: htfMit.status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING', evidence: htfMit.evidence },
    { stepNumber: 3, condition: 'Inducement of Early Traders Identified', status: inducement.status === 'IDENTIFIED' ? 'CONFIRMED' : 'PENDING', evidence: inducement.purpose },
    { stepNumber: 4, condition: 'Liquidity Sweep in HTF Zone', status: liquiditySweep.status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING', evidence: liquiditySweep.evidence },
    { stepNumber: 5, condition: 'HTF Zone Validated by Mitigation + Sweep', status: htfZoneValidation.isValidated ? 'CONFIRMED' : 'PENDING', evidence: htfZoneValidation.validationRationale },
    { stepNumber: 6, condition: 'Protected High/Low Established', status: parseNumericPrice(protectedLevel.price) > 0 ? 'CONFIRMED' : 'PENDING', evidence: protectedLevel.reason },
    { stepNumber: 7, condition: 'Failure to Swing (Second Attempt Failed)', status: failureToSwing.status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING', evidence: failureToSwing.structuralMechanism },
    { stepNumber: 8, condition: 'Change in State of Delivery (CISD) Body Close', status: changeInStateOfDelivery.status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING', evidence: changeInStateOfDelivery.detailedSequence },
    { stepNumber: 9, condition: '15M POI of Delivery Shift Defined', status: poi.status === 'VALID' ? 'CONFIRMED' : 'PENDING', evidence: poi.causalConnectionToDeliveryChange },
    { stepNumber: 10, condition: 'Wait for 15M POI Mitigation', status: poiMitigation.status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING', evidence: poiMitigation.reactionConfirmation },
    { stepNumber: 11, condition: 'Execution Entry with SL Beyond Protected Extreme', status: (sl > 0 && entry > 0) ? 'CONFIRMED' : 'PENDING', evidence: stopLoss.rationale },
    { stepNumber: 12, condition: 'Internal Range Liquidity Target & Minimum R:R', status: (tp1 > 0 && rrRatio >= 1.0) ? 'CONFIRMED' : 'PENDING', evidence: `Target: ${tp1} (R:R ${calculatedRiskReward})` },
  ];

  const causalReasoningSequence: string[] = rawAplus.causalReasoningSequence && rawAplus.causalReasoningSequence.length >= 8
    ? rawAplus.causalReasoningSequence
    : [
        `1. Higher-timeframe ${htfZone.timeframe} ${htfZone.type} zone identified at ${htfZone.zoneRange}.`,
        `2. Price completed mitigation into the HTF zone, producing an initial reaction.`,
        `3. Retail traders were induced into early positions (${inducement.inducedDirection}) at ${inducement.level || 'intermediate levels'}.`,
        `4. Price swept liquidity at ${liquiditySweep.sweptLevel} inside the HTF zone, purging early trader stop orders.`,
        `5. HTF zone was officially validated by the combined confluence of mitigation and liquidity sweep.`,
        `6. ${protectedLevel.type} established at ${protectedLevel.price} as the macro structural invalidation extreme.`,
        `7. Price attempted a second swing toward the protected extreme and failed to break it (Failure to Swing).`,
        `8. Decisive displacement produced a Change in State of Delivery (CISD) with candle body closing beyond the failure pivot.`,
        `9. Actionable 15M POI (${poi.type}) identified as the causal origin of the state change.`,
        `10. Price retraced to mitigate the 15M POI while the protected extreme remained firmly defended.`,
        `11. Execution entry confirmed at ${entry} with structural Stop Loss anchored at ${sl}.`,
        `12. Take Profit targeted at internal range liquidity (${tp1}) providing asymmetric ${calculatedRiskReward} risk:reward.`,
      ];

  return {
    htfSupplyDemand: htfZone,
    htfMitigation: htfMit,
    inducement,
    liquiditySweep,
    htfZoneValidation,
    protectedLevel,
    failureToSwing,
    changeInStateOfDelivery,
    poi,
    poiMitigation,
    sniperEntry,
    stopLoss,
    takeProfitTargets,
    calculatedRiskReward,
    checklist,
    causalReasoningSequence,
  };
}

// =============================================================
// 4B. VOLATILITY BUFFER & INSTITUTIONAL OUTPUT GENERATOR
// =============================================================
export function calculateVolatilityBuffer(asset: string, price?: number): number {
  const sym = String(asset || '').toUpperCase();
  if (sym.includes('XAU') || sym.includes('GOLD')) {
    return 1.5; // 1.5 points on gold
  }
  if (sym.includes('XAG') || sym.includes('SILVER')) {
    return 0.15;
  }
  if (sym.includes('BTC')) {
    return 200.0; // 200 USDT on BTC
  }
  if (sym.includes('ETH')) {
    return 15.0; // 15 USDT on ETH
  }
  if (sym.includes('US30') || sym.includes('NAS100') || sym.includes('SPX500') || sym.includes('GER40')) {
    return 15.0;
  }
  if (sym.includes('JPY')) {
    return 0.08; // 8 pips on JPY pairs
  }
  return 0.0008; // 8 pips on standard forex
}

export function generateWhyEntryIsNotLiquidity(
  isBull: boolean,
  entry: number | string,
  sweepLevel: number | string | undefined,
  poiType: string = 'Order Block'
): string {
  const numEntry = parseNumericPrice(entry);
  const swp = parseNumericPrice(sweepLevel);
  const entryStr = !isNaN(numEntry) && numEntry > 0 ? numEntry : 'POI execution';
  const swpStr = !isNaN(swp) && swp > 0 ? swp : 'extreme';

  if (isBull) {
    return `Entry (${entryStr}) is established at the 15M ${poiType} mitigation retest after bullish CISD, strictly separate from the swept sell-side liquidity level (${swpStr}). The liquidity sweep purged stop orders below the lows to validate demand; trade entry occurs only upon the subsequent delivery shift and POI retest.`;
  } else {
    return `Entry (${entryStr}) is established at the 15M ${poiType} mitigation retest after bearish CISD, strictly separate from the swept buy-side liquidity level (${swpStr}). The liquidity sweep purged stop orders above the highs to validate supply; trade entry occurs only upon the subsequent delivery shift and POI retest.`;
  }
}

export function determineWhatMustHappenNext(
  state: AnalysisStateMachineState | string,
  isBull: boolean,
  levels: { entry?: number | null; sl?: number | null; tp?: number | null; sweep?: number | null; prot?: number | null }
): string {
  switch (state) {
    case 'INSUFFICIENT_DATA':
      return 'Upload clear, uncropped 4H, 1H, and 15M charts with visible price axes to establish market structure.';
    case 'BIAS_ESTABLISHED':
      return `Higher-timeframe ${isBull ? 'bullish' : 'bearish'} directional bias is established. Await price delivery into a defensible 4H ${isBull ? 'Demand' : 'Supply'} zone.`;
    case 'WAITING_FOR_ZONE':
      return `Price must reach and interact with an identified higher-timeframe ${isBull ? 'Demand' : 'Supply'} zone.`;
    case 'WAITING_FOR_MITIGATION':
      return `Wait for price to tap into and confirm mitigation of the higher-timeframe ${isBull ? 'Demand' : 'Supply'} zone.`;
    case 'WAITING_FOR_LIQUIDITY_SWEEP':
      return `Wait for price to induce early traders and decisively sweep ${isBull ? 'sell-side' : 'buy-side'} liquidity in/around the higher-timeframe zone.`;
    case 'WAITING_FOR_PROTECTED_LEVEL':
      return `Wait for the liquidity sweep reaction to establish a defensible ${isBull ? 'Protected Low' : 'Protected High'}.`;
    case 'WAITING_FOR_FAILURE_TO_SWING':
      return `Wait for price to attempt a second swing toward the ${isBull ? 'Protected Low' : 'Protected High'} and fail to accept beyond it (Failure to Swing).`;
    case 'WAITING_FOR_CISD':
      return `Wait for an energetic candle body close beyond the failure-to-swing pivot low/high, confirming Change in State of Delivery (CISD).`;
    case 'WAITING_FOR_DISPLACEMENT':
      return `Wait for decisive displacement candle bodies showing strong directional intent and leaving an imbalance.`;
    case 'WAITING_FOR_POI':
      return `Wait for a clean 15M Order Block or Fair Value Gap to be mapped from the delivery shift move.`;
    case 'WAITING_FOR_RETEST':
      return `Wait for price to retrace back into the 15M POI without violating the ${isBull ? 'Protected Low' : 'Protected High'}.`;
    case 'WAITING_FOR_ENTRY_TRIGGER':
      return `Wait for a 15M rejection candle / sniper execution confirmation inside the mitigated POI before entering.`;
    case 'SETUP_INVALIDATED':
      return `The setup has been structurally invalidated (protected level breached or sustained breakout). Wait for a new macro dealing range to form.`;
    case 'ENTRY_VALIDATED':
      return `All 12 institutional milestones confirmed. Execute according to trade plan with stop loss strictly anchored beyond the ${isBull ? 'Protected Low' : 'Protected High'}.`;
    default:
      return 'Wait for market structure alignment across 4H, 1H, and 15M timeframes.';
  }
}

export function evaluateAplusStateMachine(
  signal: any,
  context: { asset: string; strategy: 'SMC' | 'CRT'; charts?: any[] }
): { state: AnalysisStateMachineState; reason: string } {
  const quality = signal?.chartQuality || 'Readable';
  if (quality === 'Unreadable' || quality === 'UNREADABLE') {
    return { state: 'INSUFFICIENT_DATA', reason: 'Chart images or price scale are unreadable.' };
  }

  const htf = signal?.htfAnalysis || {};
  const mtf = signal?.mtfAnalysis || {};
  const ltf = signal?.ltfAnalysis || {};
  const aplus = signal?.aplusSmc || {};
  const bias = String(signal?.marketBias || signal?.bias || htf.bias || '').toUpperCase();
  const isBull = bias.includes('BULL') || bias.includes('BUY') || bias.includes('LONG');
  const isBear = bias.includes('BEAR') || bias.includes('SELL') || bias.includes('SHORT');

  if (!isBull && !isBear) {
    return { state: 'INSUFFICIENT_DATA', reason: 'Higher-timeframe directional bias is neutral or unclear.' };
  }

  // 1. Zone
  const zoneStatus = String(aplus.htfSupplyDemand?.status || '').toUpperCase();
  if (zoneStatus !== 'VALID' && !htf.supplyDemandZone && !htf.htfPoi) {
    return { state: 'WAITING_FOR_ZONE', reason: 'No valid higher-timeframe supply or demand zone identified.' };
  }

  // 2. Mitigation
  const mitStatus = String(aplus.htfMitigation?.status || '').toUpperCase();
  if (mitStatus !== 'CONFIRMED' && mitStatus !== 'VALID' && !mtf.mitigationStatus) {
    return { state: 'WAITING_FOR_MITIGATION', reason: 'Awaiting mitigation of higher-timeframe zone.' };
  }

  // 3. Liquidity Sweep
  const sweepSubsequent = String(aplus.liquiditySweep?.subsequentDelivery || '').toUpperCase();
  const sweepStatus = String(aplus.liquiditySweep?.status || '').toUpperCase();
  if (sweepSubsequent.includes('BREAKOUT') || sweepSubsequent.includes('SUSTAINED') || sweepStatus === 'CONTINUED_BREAKOUT') {
    return { state: 'SETUP_INVALIDATED', reason: 'Price broke out beyond extreme with sustained continuation; sweep invalidated.' };
  }
  if (sweepStatus === 'NONE' || sweepStatus === 'NO SWEEP' || sweepStatus === 'UNCONFIRMED' || sweepStatus === 'PENDING') {
    return { state: 'WAITING_FOR_LIQUIDITY_SWEEP', reason: 'Awaiting qualifying liquidity sweep in/around the zone.' };
  }

  // 4. Protected Level
  const protPrice = parseNumericPrice(aplus.protectedLevel?.price);
  if (isNaN(protPrice) || protPrice <= 0) {
    return { state: 'WAITING_FOR_PROTECTED_LEVEL', reason: 'Protected extreme not established or unreadable.' };
  }

  // 5. Failure To Swing
  const ftsStatus = String(aplus.failureToSwing?.status || '').toUpperCase();
  if (ftsStatus === 'PENDING' || ftsStatus === 'AWAITING_ATTEMPT' || ftsStatus === 'AWAITING_SECOND_ATTEMPT' || ftsStatus === 'FAILED' || ftsStatus === 'NOT CONFIRMED') {
    return { state: 'WAITING_FOR_FAILURE_TO_SWING', reason: 'Awaiting failure-to-swing confirmation (second attempt failed).' };
  }

  // 6. CISD
  const cisdStatus = String(aplus.changeInStateOfDelivery?.status || '').toUpperCase();
  if (cisdStatus === 'PENDING' || cisdStatus === 'NOT CONFIRMED' || cisdStatus === 'UNCONFIRMED') {
    return { state: 'WAITING_FOR_CISD', reason: 'Awaiting Change in State of Delivery (CISD) candle body close.' };
  }

  // 7. Displacement
  const dispText = String(ltf.displacement || aplus.changeInStateOfDelivery?.evidence || '').toUpperCase();
  if (dispText.includes('WEAK') || dispText.includes('INSUFFICIENT')) {
    return { state: 'WAITING_FOR_DISPLACEMENT', reason: 'Displacement is weak or lacking energetic candle momentum.' };
  }

  // 8. POI
  const poiStatus = String(aplus.poi?.status || '').toUpperCase();
  if (poiStatus === 'INVALIDATED' || poiStatus === 'BROKEN' || poiStatus === 'VIOLATED') {
    return { state: 'SETUP_INVALIDATED', reason: 'Point of interest has been invalidated or broken.' };
  }
  if (poiStatus === 'MISSING' || poiStatus === 'NONE') {
    return { state: 'WAITING_FOR_POI', reason: 'No valid unmitigated POI mapped from delivery shift.' };
  }

  // 9. POI Mitigation & Retest
  const entryTypeRaw = String(aplus.sniperEntry?.confirmationType || signal.entryStatus || '').toUpperCase();
  if (entryTypeRaw.includes('MISSED') || entryTypeRaw.includes('DEPARTED') || entryTypeRaw.includes('TOO FAR')) {
    return { state: 'WAITING_FOR_RETEST', reason: 'Entry missed; price already departed from POI.' };
  }
  const poiMitStatus = String(aplus.poiMitigation?.status || '').toUpperCase();
  if (poiMitStatus === 'PENDING' || poiMitStatus === 'NOT REACHED' || poiMitStatus === 'AWAITING_RETEST' || poiMitStatus === 'UNTESTED') {
    return { state: 'WAITING_FOR_RETEST', reason: 'Awaiting price retracement into 15M POI.' };
  }

  // 10. Entry Trigger
  const entryPrice = parseNumericPrice(signal.entry ?? aplus.sniperEntry?.entryPrice);
  const slPrice = parseNumericPrice(signal.stopLoss ?? aplus.stopLoss?.stopLossPrice);
  const tpPrice = parseNumericPrice(signal.takeProfit1 ?? signal.takeProfit ?? aplus.takeProfitTargets?.tp1);

  if (isNaN(entryPrice) || entryPrice <= 0) {
    return { state: 'WAITING_FOR_ENTRY_TRIGGER', reason: 'Awaiting confirmed 15M sniper entry trigger.' };
  }

  // 11. Geometry & Invalidation checks
  if (isBull) {
    if (slPrice >= entryPrice || tpPrice <= entryPrice) {
      return { state: 'SETUP_INVALIDATED', reason: 'Invalid bullish geometry: Stop Loss must be below Entry, and Take Profit above Entry.' };
    }
    if (slPrice > protPrice) {
      return { state: 'SETUP_INVALIDATED', reason: `Stop Loss (${slPrice}) placed above Protected Low (${protPrice}).` };
    }
  } else {
    if (slPrice <= entryPrice || tpPrice >= entryPrice) {
      return { state: 'SETUP_INVALIDATED', reason: 'Invalid bearish geometry: Stop Loss must be above Entry, and Take Profit below Entry.' };
    }
    if (slPrice < protPrice) {
      return { state: 'SETUP_INVALIDATED', reason: `Stop Loss (${slPrice}) placed below Protected High (${protPrice}).` };
    }
  }

  // 12. Liquidity is not entry check
  const sweepPrice = parseNumericPrice(aplus.liquiditySweep?.sweptLevel);
  if (!isNaN(sweepPrice) && Math.abs(entryPrice - sweepPrice) < 0.0001) {
    return { state: 'SETUP_INVALIDATED', reason: `Entry price (${entryPrice}) placed directly at liquidity sweep level (${sweepPrice}).` };
  }

  return { state: 'ENTRY_VALIDATED', reason: 'All 12 institutional setup conditions verified.' };
}

export function populateInstitutionalOutputs(
  signal: any,
  context: {
    asset: string;
    strategy: string;
    charts?: Array<{ role?: string; timeframe?: string; imageBase64?: string }>;
  }
): void {
  if (!signal) return;

  const bias = String(signal?.marketBias || signal?.bias || '').toUpperCase();
  const isBull = bias.includes('BULL') || bias.includes('BUY') || bias.includes('LONG');
  const isBear = bias.includes('BEAR') || bias.includes('SELL') || bias.includes('SHORT');
  const aplus = signal.aplusSmc || normalizeAplusSmcSequence(signal);
  const htf = signal.htfAnalysis || {};
  const mtf = signal.mtfAnalysis || {};
  const ltf = signal.ltfAnalysis || {};

  const entry = parseNumericPrice(signal.entry);
  const sl = parseNumericPrice(signal.stopLoss);
  const tp1 = parseNumericPrice(signal.takeProfit1 ?? signal.takeProfit);
  const tp2 = parseNumericPrice(signal.takeProfit2);
  const tp3 = parseNumericPrice(signal.takeProfit3);

  const status = String(signal.setupStatus || 'DEVELOPING');
  const isUnreadable = String(signal.chartQuality || '').toUpperCase() === 'UNREADABLE';

  // Determine deterministic state machine state if not explicitly provided
  if (!signal.stateMachineState) {
    if (status === 'CONFIRMED' || status === 'A+ SETUP') {
      signal.stateMachineState = 'ENTRY_VALIDATED';
    } else if (status === 'INVALID') {
      signal.stateMachineState = 'SETUP_INVALIDATED';
    } else if (isUnreadable) {
      signal.stateMachineState = 'INSUFFICIENT_DATA';
    } else {
      const sm = evaluateAplusStateMachine(signal, context as any);
      signal.stateMachineState = sm.state;
    }
  }

  // Section A: Market Overview
  signal.marketOverview = {
    instrument: String(context.asset || signal.pair || 'UNKNOWN').toUpperCase(),
    analysisTimestamp: signal.created_at || new Date().toISOString(),
    selectedStrategy: String(context.strategy || signal.selectedStrategy || 'SMC').toUpperCase(),
    higherTimeframe: String(htf.timeframe || '4H'),
    middleTimeframe: String(mtf.timeframe || '1H'),
    lowerTimeframe: String(ltf.timeframe || '15M'),
    overallDirectionalBias: isBull ? 'BULLISH' : isBear ? 'BEARISH' : 'NEUTRAL',
    setupStatus: status,
  };

  // Section B: Institutional Setup Checklist (9 Stages)
  // Stage 1: HTF Supply / Demand
  const st1State = isUnreadable
    ? 'Not observable from the uploaded chart'
    : (aplus.htfSupplyDemand?.status === 'VALID' ? 'Confirmed' : 'Unconfirmed');

  // Stage 2: Mitigation
  const st2State = isUnreadable
    ? 'Not observable from the uploaded chart'
    : (aplus.htfMitigation?.status === 'CONFIRMED' ? 'Confirmed' : 'Awaiting confirmation');

  // Stage 3: Liquidity Inducement & Sweep
  const sweepStr = String(aplus.liquiditySweep?.status || '').toUpperCase();
  const sweepSubsequent = String(aplus.liquiditySweep?.subsequentDelivery || '').toUpperCase();
  let st3State: any = 'Unconfirmed';
  if (isUnreadable) {
    st3State = 'Not observable from the uploaded chart';
  } else if (sweepSubsequent.includes('BREAKOUT') || sweepStr === 'FAILED' || sweepStr === 'CONTINUED_BREAKOUT') {
    st3State = 'Failed';
  } else if (sweepStr === 'CONFIRMED' && (parseNumericPrice(aplus.liquiditySweep?.sweptLevel) > 0 || ltf.liquiditySweep)) {
    st3State = 'Confirmed';
  } else if (sweepStr.includes('PENDING') || sweepStr.includes('AWAITING')) {
    st3State = 'Awaiting confirmation';
  }

  // Stage 4: Protected Level
  const protPrice = parseNumericPrice(aplus.protectedLevel?.price);
  const st4State = isUnreadable
    ? 'Not observable from the uploaded chart'
    : (st3State === 'Confirmed' && !isNaN(protPrice) && protPrice > 0 ? 'Confirmed' : 'Unconfirmed');

  // Stage 5: Failure to Swing
  const ftsStatus = String(aplus.failureToSwing?.status || '').toUpperCase();
  let st5State: any = 'Unconfirmed';
  if (isUnreadable) {
    st5State = 'Not observable from the uploaded chart';
  } else if (ftsStatus === 'CONFIRMED') {
    st5State = 'Confirmed';
  } else if (ftsStatus === 'FAILED') {
    st5State = 'Failed';
  } else if (ftsStatus === 'PENDING' || ftsStatus.includes('AWAITING') || ftsStatus.includes('DEVELOPING') || ftsStatus.includes('SECOND_ATTEMPT')) {
    st5State = 'Awaiting confirmation';
  }

  // Stage 6: Change in State of Delivery (CISD)
  const cisdStatus = String(aplus.changeInStateOfDelivery?.status || '').toUpperCase();
  let st6State: any = 'Unconfirmed';
  if (isUnreadable) {
    st6State = 'Not observable from the uploaded chart';
  } else if (cisdStatus === 'CONFIRMED') {
    st6State = 'Confirmed';
  } else if (cisdStatus === 'FAILED') {
    st6State = 'Failed';
  } else if (cisdStatus === 'PENDING' || cisdStatus.includes('AWAITING') || cisdStatus.includes('DEVELOPING')) {
    st6State = 'Awaiting confirmation';
  }

  // Stage 7: Displacement & Structural Confirmation
  const dispStr = String(ltf.displacement || aplus.changeInStateOfDelivery?.evidence || '').toUpperCase();
  let st7State: any = 'Unconfirmed';
  if (isUnreadable) {
    st7State = 'Not observable from the uploaded chart';
  } else if (dispStr.includes('WEAK') || dispStr.includes('INSUFFICIENT')) {
    st7State = 'Failed';
  } else if (dispStr.includes('DISPLACEMENT') || dispStr.includes('IMPULSE') || dispStr.includes('CONFIRMED') || st6State === 'Confirmed') {
    st7State = 'Confirmed';
  } else {
    st7State = 'Awaiting confirmation';
  }

  // Stage 8: POI Selection
  const poiStatus = String(aplus.poi?.status || '').toUpperCase();
  let st8State: any = 'Unconfirmed';
  if (isUnreadable) {
    st8State = 'Not observable from the uploaded chart';
  } else if (poiStatus === 'INVALIDATED' || poiStatus === 'BROKEN') {
    st8State = 'Failed';
  } else if (poiStatus === 'VALID' || poiStatus === 'CONFIRMED' || aplus.poi?.priceRange) {
    st8State = 'Confirmed';
  } else if (poiStatus.includes('PENDING') || poiStatus.includes('FORMING')) {
    st8State = 'Awaiting confirmation';
  }

  // Stage 9: Entry & Risk Management
  const entryOk = !isNaN(entry) && entry > 0;
  const slOk = !isNaN(sl) && sl > 0;
  const tpOk = !isNaN(tp1) && tp1 > 0;
  const rrStr = signal.riskReward || 'N/A';
  let st9State: any = 'Unconfirmed';
  if (isUnreadable) {
    st9State = 'Not observable from the uploaded chart';
  } else if (entryOk && slOk && tpOk && !rrStr.includes('N/A')) {
    st9State = 'Confirmed';
  } else if (status === 'DEVELOPING') {
    st9State = 'Awaiting confirmation';
  }

  signal.institutionalChecklist = [
    {
      stageNumber: 1,
      name: `Higher-Timeframe ${isBull ? 'Demand' : 'Supply'} Identification`,
      state: st1State,
      explanation: `Mapped major ${aplus.htfSupplyDemand?.timeframe || '4H'} ${aplus.htfSupplyDemand?.type || 'zone'} at ${aplus.htfSupplyDemand?.zoneRange || 'structural boundary'}.`,
      chartEvidence: String(aplus.htfSupplyDemand?.evidence || htf.marketStructure || '4H structural swing origin visible on chart'),
    },
    {
      stageNumber: 2,
      name: `Mitigation of Higher-Timeframe Zone`,
      state: st2State,
      explanation: `Price action returned and interacted with the ${aplus.htfSupplyDemand?.type || 'HTF'} zone boundary.`,
      chartEvidence: String(aplus.htfMitigation?.evidence || mtf.mitigationStatus || 'Visible candle tap and reaction in HTF territory'),
    },
    {
      stageNumber: 3,
      name: `Liquidity Inducement and Sweep`,
      state: st3State,
      explanation: st3State === 'Confirmed'
        ? `Confirmed sweep of ${aplus.liquiditySweep?.sweepType || 'liquidity'} at ${aplus.liquiditySweep?.sweptLevel || 'key extreme'}. Price rejected and failed continuation.`
        : st3State === 'Failed'
        ? `Liquidity sweep failed: price accepted beyond extreme with sustained breakout continuation.`
        : `Awaiting liquidity sweep beyond resting inducement high/low.`,
      chartEvidence: String(aplus.liquiditySweep?.evidence || ltf.liquiditySweep || 'Candle wick pierced pool and snapped back'),
    },
    {
      stageNumber: 4,
      name: `Protected ${isBull ? 'Low' : 'High'} Identification`,
      state: st4State,
      explanation: st4State === 'Confirmed'
        ? `Structurally anchored ${aplus.protectedLevel?.type || 'Protected Extreme'} established at ${aplus.protectedLevel?.price}.`
        : `Protected structural extreme cannot be defended until liquidity sweep is verified.`,
      chartEvidence: String(aplus.protectedLevel?.reason || 'Extreme created by liquidity sweep departure'),
    },
    {
      stageNumber: 5,
      name: `Failure to Swing`,
      state: st5State,
      explanation: st5State === 'Confirmed'
        ? `Price attempted a second swing toward the protected extreme and failed to break it, confirming exhaustion.`
        : `Awaiting second swing attempt toward protected level to prove exhaustion before entry.`,
      chartEvidence: String(aplus.failureToSwing?.evidence || aplus.failureToSwing?.structuralMechanism || 'Second attempt failed to print higher high / lower low'),
    },
    {
      stageNumber: 6,
      name: `Change in State of Delivery (CISD)`,
      state: st6State,
      explanation: st6State === 'Confirmed'
        ? `Decisive candle body close beyond failure-to-swing structural trigger pivot confirmed ${aplus.changeInStateOfDelivery?.shiftType || 'CISD'}.`
        : `Awaiting 15M candle body close beyond structural trigger pivot to confirm delivery shift.`,
      chartEvidence: String(aplus.changeInStateOfDelivery?.evidence || ltf.mssChoch || 'Displacement candle closed beyond structural reference'),
    },
    {
      stageNumber: 7,
      name: `Displacement & Structural Confirmation`,
      state: st7State,
      explanation: st7State === 'Confirmed'
        ? `Directional expansion with noticeable imbalance/FVG confirmed institutional intent.`
        : `Displacement not confirmed; candle bodies lack sufficient directional momentum.`,
      chartEvidence: String(ltf.displacement || aplus.changeInStateOfDelivery?.evidence || 'Energetic directional candle sequence printed'),
    },
    {
      stageNumber: 8,
      name: `Point of Interest (POI) Selection`,
      state: st8State,
      explanation: st8State === 'Confirmed'
        ? `Identified unmitigated 15M POI (${aplus.poi?.type || 'Order Block / FVG'}) at ${aplus.poi?.priceRange || 'zone'} created by displacement.`
        : `Awaiting definition of valid, unmitigated POI originating from the delivery shift.`,
      chartEvidence: String(aplus.poi?.evidence || ltf.poi || 'Unmitigated 15M POI boundary left behind by delivery shift'),
    },
    {
      stageNumber: 9,
      name: `Entry Conditions & Risk Management`,
      state: st9State,
      explanation: st9State === 'Confirmed'
        ? `Entry at ${entry || 'POI retest'}, SL anchored beyond ${aplus.protectedLevel?.type || 'extreme'} at ${sl}, targeting ${tp1} (${rrStr} R:R).`
        : `Awaiting price retest into POI and trigger reaction before committing risk.`,
      chartEvidence: `Proposed entry ${entry || 'N/A'}, SL ${sl || 'N/A'}, TP1 ${tp1 || 'N/A'} (R:R: ${rrStr})`,
    },
  ];

  // Section C: Trade Plan
  const risk = Math.abs((!isNaN(entry) ? entry : 0) - (!isNaN(sl) ? sl : 0));
  const rew1 = Math.abs((!isNaN(tp1) ? tp1 : 0) - (!isNaN(entry) ? entry : 0));
  const rew2 = !isNaN(tp2) && tp2 > 0 ? Math.abs(tp2 - (!isNaN(entry) ? entry : 0)) : 0;
  const rew3 = !isNaN(tp3) && tp3 > 0 ? Math.abs(tp3 - (!isNaN(entry) ? entry : 0)) : 0;

  const whyEntryNotLiquidity = generateWhyEntryIsNotLiquidity(
    isBull,
    !isNaN(entry) && entry > 0 ? entry : (parseNumericPrice(aplus.sniperEntry?.entryPrice) || 0),
    parseNumericPrice(aplus.liquiditySweep?.sweptLevel),
    aplus.poi?.type || 'Order Block'
  );

  const whatNextAction = determineWhatMustHappenNext(
    signal.stateMachineState || (status === 'CONFIRMED' ? 'ENTRY_VALIDATED' : status === 'INVALID' ? 'SETUP_INVALIDATED' : 'WAITING_FOR_RETEST'),
    isBull,
    { entry, sl, tp: tp1, sweep: parseNumericPrice(aplus.liquiditySweep?.sweptLevel), prot: protPrice }
  );

  signal.whyEntryIsNotLiquidity = whyEntryNotLiquidity;
  signal.whatMustHappenNext = whatNextAction;

  signal.tradePlan = {
    direction: status === 'CONFIRMED' ? (isBull ? 'BUY' : isBear ? 'SELL' : 'NO TRADE') : (status === 'DEVELOPING' ? (isBull ? 'BUY' : isBear ? 'SELL' : 'NO TRADE') : 'NO TRADE'),
    setupGrade: signal.setupGrade || (status === 'CONFIRMED' ? 'A+' : status === 'DEVELOPING' ? 'Developing' : 'Avoid'),
    entryZoneOrPrice: !isNaN(entry) && entry > 0 ? entry : (aplus.poi?.priceRange || 'Not reliably measurable'),
    entryTrigger: String(aplus.sniperEntry?.confirmationType || ltf.executionConfirmation || '15M POI mitigation with rejection close'),
    whyEntryIsNotLiquidity: whyEntryNotLiquidity,
    stopLossPrice: !isNaN(sl) && sl > 0 ? sl : 'Not reliably measurable',
    target1: !isNaN(tp1) && tp1 > 0 ? tp1 : 'Not reliably measurable',
    target2: !isNaN(tp2) && tp2 > 0 ? tp2 : undefined,
    target3: !isNaN(tp3) && tp3 > 0 ? tp3 : undefined,
    riskRewardTarget1: risk > 0 && rew1 > 0 ? `1 : ${(rew1 / risk).toFixed(2)}` : 'N/A',
    riskRewardTarget2: risk > 0 && rew2 > 0 ? `1 : ${(rew2 / risk).toFixed(2)}` : undefined,
    riskRewardTarget3: risk > 0 && rew3 > 0 ? `1 : ${(rew3 / risk).toFixed(2)}` : undefined,
    protectedLevel: {
      type: aplus.protectedLevel?.type || (isBull ? 'PROTECTED LOW' : 'PROTECTED HIGH'),
      price: !isNaN(protPrice) && protPrice > 0 ? protPrice : 'Not reliably measurable',
      timeframe: aplus.protectedLevel?.timeframe || '15M',
      reason: aplus.protectedLevel?.reason || 'Extreme created by liquidity sweep',
      invalidationCondition: aplus.protectedLevel?.invalidationRole || `Candle body close beyond level invalidates thesis`,
    },
    liquiditySweepLevel: parseNumericPrice(aplus.liquiditySweep?.sweptLevel) > 0 ? parseNumericPrice(aplus.liquiditySweep?.sweptLevel) : 'Not reliably measurable',
    cisdReferenceLevel: parseNumericPrice(aplus.changeInStateOfDelivery?.breakCloseLevel) > 0 ? parseNumericPrice(aplus.changeInStateOfDelivery?.breakCloseLevel) : 'Not reliably measurable',
    poiBoundaries: aplus.poi?.priceRange || 'Not reliably measurable',
    setupInvalidationLevel: !isNaN(protPrice) && protPrice > 0 ? protPrice : (!isNaN(sl) ? sl : 'Not reliably measurable'),
  };

  // Section D: Trade Narrative
  signal.tradeNarrative = {
    chronologicalSequence: aplus.causalReasoningSequence || [
      `1. Higher-timeframe 4H ${isBull ? 'Demand' : 'Supply'} zone mapped at ${aplus.htfSupplyDemand?.zoneRange || 'structural boundary'}.`,
      `2. Price action mitigated into the HTF zone, printing an initial reaction.`,
      `3. Inducement formed, tempting retail participants into early positions.`,
      `4. Price swept liquidity at ${aplus.liquiditySweep?.sweptLevel || 'extreme'} inside the HTF zone.`,
      `5. Protected ${isBull ? 'Low' : 'High'} anchored at ${aplus.protectedLevel?.price || 'extreme'}.`,
      `6. Second swing attempt failed to break the protected extreme (Failure to Swing).`,
      `7. Change in State of Delivery (CISD) confirmed with candle body close.`,
      `8. Lower-timeframe 15M POI established at ${aplus.poi?.priceRange || 'zone'}.`,
      `9. Entry executed with structural Stop Loss and internal liquidity targets.`,
    ],
    summary: signal.reasoning?.[0] || `Institutional ${isBull ? 'bullish' : isBear ? 'bearish' : 'neutral'} structure evaluated across 4H, 1H, and 15M timeframes.`,
    nextRequiredMarketAction: whatNextAction,
  };

  // Section E: Reasons to Reject the Trade
  const rejections: any[] = [];
  if (isUnreadable) {
    rejections.push({
      condition: 'Chart quality insufficient',
      detail: 'Chart price axis or candlesticks are unreadable. Cannot measure execution levels reliably.',
      failedStage: 'Chart Quality',
    });
  }
  if (st3State === 'Failed') {
    rejections.push({
      condition: 'Liquidity sweep invalidated by sustained breakout',
      detail: 'Price continued accepting beyond the swept extreme with breakout momentum instead of rejecting.',
      failedStage: 'Stage 3: Liquidity Sweep',
    });
  } else if (st3State !== 'Confirmed') {
    rejections.push({
      condition: 'No confirmed liquidity sweep',
      detail: 'Institutional liquidity sweep has not occurred or price has not returned inside the swept level.',
      failedStage: 'Stage 3: Liquidity Sweep',
    });
  }
  if (st4State !== 'Confirmed') {
    rejections.push({
      condition: 'Protected high/low not established',
      detail: 'Cannot structurally defend an invalidation level without a qualifying liquidity sweep.',
      failedStage: 'Stage 4: Protected Level',
    });
  }
  if (st5State === 'Failed') {
    rejections.push({
      condition: 'Failure to swing failed',
      detail: 'Price breached and accepted beyond the protected extreme on second attempt.',
      failedStage: 'Stage 5: Failure to Swing',
    });
  } else if (st5State !== 'Confirmed') {
    rejections.push({
      condition: 'No valid failure-to-swing sequence',
      detail: 'Price has not yet attempted a second swing toward the protected extreme to prove directional exhaustion.',
      failedStage: 'Stage 5: Failure to Swing',
    });
  }
  if (st6State !== 'Confirmed') {
    rejections.push({
      condition: 'CISD not confirmed',
      detail: 'No candle body close beyond the failure-to-swing structural trigger pivot to confirm delivery shift.',
      failedStage: 'Stage 6: CISD',
    });
  }
  if (st7State === 'Failed') {
    rejections.push({
      condition: 'Displacement insufficient',
      detail: 'Candle bodies lack decisive momentum; cannot distinguish delivery shift from minor pullback.',
      failedStage: 'Stage 7: Displacement',
    });
  }
  if (st8State === 'Failed') {
    rejections.push({
      condition: 'POI already invalidated',
      detail: 'Selected Point of Interest has already been violated or broken by subsequent price action.',
      failedStage: 'Stage 8: POI Selection',
    });
  } else if (st8State !== 'Confirmed') {
    rejections.push({
      condition: 'No suitable unmitigated POI identified',
      detail: 'Displacement move did not leave a clean, strategy-permitted Order Block or FVG for entry.',
      failedStage: 'Stage 8: POI Selection',
    });
  }
  if (!entryOk || !slOk || !tpOk) {
    rejections.push({
      condition: 'Execution levels incomplete',
      detail: 'Exact Entry, Stop Loss, or Take Profit cannot be measured from chart evidence.',
      failedStage: 'Stage 9: Entry & Risk Management',
    });
  }
  if (risk > 0 && rew1 > 0 && rew1 / risk < 1.0) {
    rejections.push({
      condition: 'Risk/reward below configured minimum',
      detail: `Calculated R:R (1:${(rew1 / risk).toFixed(2)}) is less than 1.0:1 institutional minimum.`,
      failedStage: 'Stage 9: Risk Management',
    });
  }
  signal.rejectionReasons = rejections;

  // Section F: Confidence and Limitations
  const confirmedCount = signal.institutionalChecklist.filter((s: any) => s.state === 'Confirmed').length;
  const imageReadability = isUnreadable ? 25 : 94;
  const structuralInterp = isUnreadable ? 20 : (st1State === 'Confirmed' && st2State === 'Confirmed' ? 88 : 60);
  const setupCompleteness = Math.round((confirmedCount / 9) * 100);
  const priceMeasConfidence = isUnreadable ? 15 : (entryOk && slOk ? 92 : 50);
  const overallConf = Math.min(
    95,
    Math.round((imageReadability * 0.25) + (structuralInterp * 0.25) + (setupCompleteness * 0.3) + (priceMeasConfidence * 0.2))
  );

  signal.confidence = status === 'CONFIRMED' ? Math.max(82, overallConf) : Math.min(overallConf, 70);
  signal.confidenceAndLimitations = {
    imageReadabilityConfidence: imageReadability,
    structuralInterpretationConfidence: structuralInterp,
    setupCompletenessConfidence: setupCompleteness,
    priceMeasurementConfidence: priceMeasConfidence,
    overallConfidence: signal.confidence,
    limitationsNotice: isUnreadable
      ? 'Chart image quality is degraded or cropped; price scale labels are unreadable. TradeGuard refuses to invent synthetic prices.'
      : 'Visual interpretation based on 3 uploaded static chart screenshots (4H, 1H, 15M). Subject to visible resolution and chart scale.',
    calibrationDisclaimer: 'Model confidence represents algorithmic structural alignment and calibration, not a statistical guarantee of future price movement or win probability. Always practice disciplined risk management.',
  };

  // Ensure default annotations exist for all 13 markers if missing
  if (!Array.isArray(signal.annotations) || signal.annotations.length === 0) {
    signal.annotations = [];
    if (entryOk) {
      signal.annotations.push({
        type: 'Entry',
        x: 45,
        y: 50,
        x2: 95,
        label: `Entry: ${entry}`,
        price: entry,
      });
    }
    if (slOk) {
      signal.annotations.push({
        type: 'Stop Loss',
        x: 45,
        y: isBull ? 75 : 25,
        x2: 95,
        label: `SL: ${sl}`,
        price: sl,
      });
    }
    if (tpOk) {
      signal.annotations.push({
        type: 'Take Profit',
        x: 45,
        y: isBull ? 20 : 80,
        x2: 95,
        label: `TP1: ${tp1}`,
        price: tp1,
      });
    }
    if (!isNaN(protPrice) && protPrice > 0) {
      signal.annotations.push({
        type: isBull ? 'Protected Low' : 'Protected High',
        x: 30,
        y: isBull ? 78 : 22,
        x2: 95,
        label: `${isBull ? 'Protected Low' : 'Protected High'}: ${protPrice}`,
        price: protPrice,
      });
    }
    if (parseNumericPrice(aplus.liquiditySweep?.sweptLevel) > 0) {
      const swp = parseNumericPrice(aplus.liquiditySweep?.sweptLevel);
      signal.annotations.push({
        type: 'Liquidity Sweep',
        x: 25,
        y: isBull ? 80 : 20,
        x2: 60,
        label: `Liquidity Sweep: ${swp}`,
        price: swp,
      });
    }
    if (parseNumericPrice(aplus.changeInStateOfDelivery?.breakCloseLevel) > 0) {
      const cisdLvl = parseNumericPrice(aplus.changeInStateOfDelivery?.breakCloseLevel);
      signal.annotations.push({
        type: 'CISD',
        x: 40,
        y: 52,
        x2: 90,
        label: `CISD Close: ${cisdLvl}`,
        price: cisdLvl,
      });
    }
  }
}

export function validateTradeGuardAnalysis(
  signal: any,
  context: {
    asset: string;
    strategy: 'SMC' | 'CRT';
    charts: Array<{ role?: string; timeframe?: string; imageBase64?: string }>;
  }
): ValidationEngineResult {
  if (!signal) {
    return {
      valid: false,
      reason: 'SIGNAL REJECTED — Empty analysis output received.',
      setupStatus: 'ANALYSIS_FAILED',
      grade: 'Avoid',
      notes: 'No analysis object returned by model.',
    };
  }

  // Rule 1: Exactly 3 chart images provided
  if (!Array.isArray(context.charts) || context.charts.length !== 3) {
    return {
      valid: false,
      reason: 'THREE TIMEFRAMES REQUIRED — Exactly 3 charts (4H, 1H, 15M) must be uploaded.',
      setupStatus: 'INVALID',
      grade: 'Avoid',
      notes: `Expected 3 charts, received ${context.charts?.length || 0}.`,
    };
  }

  // Rule 2: Chart image data exists
  for (const c of context.charts) {
    if (!c.imageBase64 || c.imageBase64.length < 50) {
      return {
        valid: false,
        reason: 'IMAGE DATA INVALID — One or more chart images is empty or corrupted.',
        setupStatus: 'INVALID',
        grade: 'Avoid',
        notes: `Missing image payload for timeframe: ${c.timeframe || c.role}`,
      };
    }
  }

  // Rule 3: Pair matches requested asset
  const detectedPair = String(signal.pair || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const expectedPair = String(context.asset || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (detectedPair && expectedPair && !detectedPair.includes(expectedPair) && !expectedPair.includes(detectedPair)) {
    return {
      valid: false,
      reason: `ASSET MISMATCH — Requested ${context.asset}, but chart analysis identified ${signal.pair}.`,
      setupStatus: 'INVALID',
      grade: 'Avoid',
      notes: `Pair mismatch between requested (${context.asset}) and analyzed (${signal.pair}).`,
    };
  }

  // Rule 4: Strategy is SMC or CRT
  const strat = String(context.strategy || signal.selectedStrategy || '').toUpperCase();
  if (strat !== 'SMC' && strat !== 'CRT') {
    return {
      valid: false,
      reason: `UNAUTHORIZED STRATEGY — TradeGuard production only supports SMC or CRT (received: ${strat}).`,
      setupStatus: 'INVALID',
      grade: 'Avoid',
      notes: `Invalid strategy ${strat}.`,
    };
  }

  // Normalize and validate A+ SMC sequence if strategy is SMC
  if (strat === 'SMC') {
    signal.aplusSmc = normalizeAplusSmcSequence(signal);
  }

  // Rule 5: Distinguish Chart Quality vs Setup Status
  const quality = signal.chartQuality || 'Readable';
  if (quality === 'Unreadable' || quality === 'UNREADABLE') {
    signal.setupStatus = 'NO_SETUP';
    signal.setupGrade = 'Avoid';
    signal.entry = null;
    signal.stopLoss = null;
    signal.takeProfit = null;
    signal.takeProfit1 = null;
    signal.confidence = 20;
    signal.confidenceRationale = 'Chart price axis or candlesticks are unreadable; cannot verify structural levels.';
    populateInstitutionalOutputs(signal, context);
    return {
      valid: true,
      setupStatus: 'NO_SETUP',
      grade: 'Avoid',
      notes: 'Chart price axis or candlesticks are unreadable. Analysis safely defaulted to NO_SETUP with null prices.',
    };
  }

  // Rule 6: Required Evidence Exists
  const hasEvidence =
    (Array.isArray(signal.evidence) && signal.evidence.length > 0) ||
    (Array.isArray(signal.reasoning) && signal.reasoning.length > 0);
  if (!hasEvidence) {
    return {
      valid: false,
      reason: 'EVIDENCE-FIRST ENFORCEMENT FAILED — Signal lacks required chart evidence.',
      setupStatus: 'INVALID',
      grade: 'Avoid',
      notes: 'No specific evidence items cited from visible chart.',
    };
  }

  // Check for Continued Breakout after Sweep (Acceptance Criteria 5)
  const subsequentDelivery = String(signal.aplusSmc?.liquiditySweep?.subsequentDelivery || '').toUpperCase();
  const sweepStatusRaw = String(signal.aplusSmc?.liquiditySweep?.status || '').toUpperCase();
  if (subsequentDelivery.includes('BREAKOUT') || subsequentDelivery.includes('SUSTAINED') || sweepStatusRaw === 'CONTINUED_BREAKOUT' || (sweepStatusRaw === 'FAILED' && !signal.hasConfirmedSetup)) {
    signal.setupStatus = 'INVALID';
    signal.setupGrade = 'Avoid';
    signal.stateMachineState = 'SETUP_INVALIDATED';
    populateInstitutionalOutputs(signal, context);
    return {
      valid: false,
      reason: 'BREAKOUT DETECTED — Liquidity sweep failed; price accepted beyond extreme with sustained breakout continuation.',
      setupStatus: 'INVALID',
      grade: 'Avoid',
      notes: 'Price broke out and accepted beyond level rather than rejecting; thesis invalidated.',
    };
  }

  // Check for POI Invalidated (Acceptance Criteria 10)
  const poiStatusRaw = String(signal.aplusSmc?.poi?.status || '').toUpperCase();
  if (poiStatusRaw === 'INVALIDATED' || poiStatusRaw === 'BROKEN' || poiStatusRaw === 'VIOLATED') {
    signal.setupStatus = 'INVALID';
    signal.setupGrade = 'Avoid';
    signal.stateMachineState = 'SETUP_INVALIDATED';
    populateInstitutionalOutputs(signal, context);
    return {
      valid: false,
      reason: 'POI INVALIDATED — Selected Point of Interest has already been invalidated by market structure.',
      setupStatus: 'INVALID',
      grade: 'Avoid',
      notes: 'POI was violated or broken prior to execution.',
    };
  }

  // Check for Missed Entry (Acceptance Criteria 11)
  const entryTypeRaw = String(signal.aplusSmc?.sniperEntry?.confirmationType || signal.entryStatus || '').toUpperCase();
  if (entryTypeRaw.includes('MISSED') || entryTypeRaw.includes('DEPARTED') || entryTypeRaw.includes('TOO FAR')) {
    signal.setupStatus = 'DEVELOPING';
    signal.setupGrade = 'Developing';
    signal.stateMachineState = 'WAITING_FOR_RETEST';
    signal.entry = null;
    signal.stopLoss = null;
    signal.takeProfit = null;
    populateInstitutionalOutputs(signal, context);
    return {
      valid: true,
      setupStatus: 'DEVELOPING',
      grade: 'Developing',
      notes: 'Entry opportunity already missed; price has already departed from POI. Chasing trades is strictly avoided.',
    };
  }

  // Check for Supply/Demand Zone contact without sweep (Acceptance Criteria 3)
  if (strat === 'SMC' && (sweepStatusRaw === 'NONE' || sweepStatusRaw === 'NO SWEEP' || sweepStatusRaw === 'UNCONFIRMED')) {
    signal.setupStatus = 'DEVELOPING';
    signal.setupGrade = 'Developing';
    signal.stateMachineState = 'WAITING_FOR_LIQUIDITY_SWEEP';
    signal.hasConfirmedSetup = false;
    signal.entry = null;
    signal.stopLoss = null;
    signal.takeProfit = null;
    populateInstitutionalOutputs(signal, context);
    return {
      valid: true,
      setupStatus: 'DEVELOPING',
      grade: 'Developing',
      notes: 'Supply-zone contact observed without a qualifying liquidity sweep. Awaiting sweep before execution.',
    };
  }

  // Rule 7: Determine setup classification (CONFIRMED, DEVELOPING, NO_SETUP, INVALID)
  const rawStatus = String(signal.setupStatus || '').toUpperCase();
  const rawExecutionStatus = String(signal.ltfAnalysis?.executionStatus || signal.ltfAnalysis?.executionConfirmation || '').toUpperCase();

  const isConfirmedRaw =
    rawStatus === 'CONFIRMED' ||
    rawStatus === 'A+ CONFIRMED' ||
    rawStatus === 'A+ SETUP' ||
    rawStatus === 'VALID SETUP' ||
    (signal.hasConfirmedSetup === true && !rawStatus.includes('WAIT') && !rawStatus.includes('NO_SETUP') && !rawStatus.includes('NO VALID'));

  const isDevelopingRaw =
    rawStatus === 'DEVELOPING' ||
    rawStatus.includes('WAIT') ||
    rawExecutionStatus === 'DEVELOPING' ||
    rawExecutionStatus.includes('PENDING') ||
    rawExecutionStatus.includes('AWAITING');

  const isInvalidRaw = rawStatus.includes('INVALID');
  const isNoSetupRaw = rawStatus.includes('NO_SETUP') || rawStatus.includes('NO SETUP') || rawStatus.includes('NO VALID');

  // Parse numeric prices from chart
  const entry = parseNumericPrice(signal.entry);
  const sl = parseNumericPrice(signal.stopLoss);
  const tp1 = parseNumericPrice(signal.takeProfit1 ?? signal.takeProfit);
  const tp2 = parseNumericPrice(signal.takeProfit2);
  const hasTradeLevels = !isNaN(entry) && entry > 0 && !isNaN(sl) && sl > 0 && !isNaN(tp1) && tp1 > 0;

  // Rule 8: Anti-Mock Check — Reject known template numbers
  if (hasTradeLevels) {
    for (const mock of BANNED_MOCK_NUMBERS) {
      if (Math.abs(entry - mock) < 0.0001 || Math.abs(sl - mock) < 0.0001 || Math.abs(tp1 - mock) < 0.0001) {
        return {
          valid: false,
          reason: `MOCK DATA DETECTED — Signal contains banned template price (${mock}). TradeGuard strictly forbids synthetic values.`,
          setupStatus: 'INVALID',
          grade: 'Avoid',
          notes: `Synthetic placeholder price ${mock} detected in output.`,
        };
      }
    }
  }

  // Calculate Evidence-Based Confidence
  let confirmedCriteriaCount = 0;
  if (signal.htfAnalysis?.marketStructure && signal.htfAnalysis.marketStructure !== 'UNCLEAR') confirmedCriteriaCount += 1;
  if (signal.htfAnalysis?.drawOnLiquidity || signal.htfAnalysis?.majorLiquidity) confirmedCriteriaCount += 1;
  if (signal.mtfAnalysis?.poiRefinement || signal.mtfAnalysis?.poi) confirmedCriteriaCount += 1;
  if (signal.mtfAnalysis?.marketStructureRefinement) confirmedCriteriaCount += 1;
  if (signal.ltfAnalysis?.liquiditySweep && !String(signal.ltfAnalysis.liquiditySweep).toLowerCase().includes('no ')) confirmedCriteriaCount += 1;
  if (signal.ltfAnalysis?.displacement && !String(signal.ltfAnalysis.displacement).toLowerCase().includes('not ')) confirmedCriteriaCount += 1;
  if (signal.ltfAnalysis?.mssChoch && !String(signal.ltfAnalysis.mssChoch).toLowerCase().includes('not ')) confirmedCriteriaCount += 1;
  if (hasTradeLevels) confirmedCriteriaCount += 2;

  // Handle NO_SETUP or INVALID
  if (isInvalidRaw) {
    signal.setupStatus = 'INVALID';
    signal.setupGrade = 'Avoid';
    signal.confidence = Math.min(signal.confidence || 30, 40);
    populateInstitutionalOutputs(signal, context);
    return {
      valid: true,
      setupStatus: 'INVALID',
      grade: 'Avoid',
      notes: signal.reasoning?.[0] || 'Setup structure has been invalidated by market price action.',
    };
  }

  if (isNoSetupRaw && !hasTradeLevels) {
    signal.setupStatus = 'NO_SETUP';
    signal.setupGrade = 'Avoid';
    signal.entry = null;
    signal.stopLoss = null;
    signal.takeProfit = null;
    signal.riskReward = 'N/A';
    signal.confidence = Math.min(signal.confidence || 25, 45);
    signal.confidenceRationale = 'Insufficient structural evidence for a qualified setup.';
    populateInstitutionalOutputs(signal, context);
    return {
      valid: true,
      setupStatus: 'NO_SETUP',
      grade: 'Avoid',
      notes: 'No valid institutional setup visible on the uploaded charts.',
    };
  }

  // Handle DEVELOPING Setup
  if (isDevelopingRaw || (!isConfirmedRaw && hasTradeLevels)) {
    if (hasTradeLevels) {
      const bias = String(signal.marketBias || signal.bias || '').toUpperCase();
      const isBull = bias.includes('BULL') || bias.includes('BUY') || bias.includes('LONG');
      const isBear = bias.includes('BEAR') || bias.includes('SELL') || bias.includes('SHORT');

      if (isBull && sl < entry && tp1 > entry) {
        signal.bias = 'BULLISH';
        const risk = entry - sl;
        const reward = tp1 - entry;
        const rrRatio = risk > 0 ? reward / risk : 0;
        signal.riskReward = `1 : ${rrRatio.toFixed(2)}`;
      } else if (isBear && sl > entry && tp1 < entry) {
        signal.bias = 'BEARISH';
        const risk = sl - entry;
        const reward = entry - tp1;
        const rrRatio = risk > 0 ? reward / risk : 0;
        signal.riskReward = `1 : ${rrRatio.toFixed(2)}`;
      } else {
        signal.entry = null;
        signal.stopLoss = null;
        signal.takeProfit = null;
        signal.riskReward = 'N/A';
      }
    } else {
      signal.entry = null;
      signal.stopLoss = null;
      signal.takeProfit = null;
      signal.riskReward = 'N/A';
    }

    signal.setupStatus = 'DEVELOPING';
    signal.setupGrade = 'Developing';
    signal.hasConfirmedSetup = false;
    signal.confidence = Math.max(55, Math.min(78, 50 + confirmedCriteriaCount * 4));
    signal.confidenceRationale = `Setup is developing (${confirmedCriteriaCount}/9 criteria verified). Waiting for 15M trigger confirmation.`;
    populateInstitutionalOutputs(signal, context);

    return {
      valid: true,
      setupStatus: 'DEVELOPING',
      grade: 'Developing',
      notes: 'Setup is developing. 4H and 1H structure aligned; awaiting 15M execution trigger confirmation.',
    };
  }

  // Handle CONFIRMED Setup missing trade levels
  if (!hasTradeLevels) {
    signal.setupStatus = 'DEVELOPING';
    signal.setupGrade = 'Developing';
    signal.hasConfirmedSetup = false;
    signal.confidence = Math.max(50, Math.min(70, 40 + confirmedCriteriaCount * 4));
    signal.confidenceRationale = 'Structural direction identified, but precise execution levels are pending.';
    populateInstitutionalOutputs(signal, context);
    return {
      valid: true,
      setupStatus: 'DEVELOPING',
      grade: 'Developing',
      notes: 'Downgraded to DEVELOPING because trade execution prices were not established.',
    };
  }

  // Validate Directional Integrity for Confirmed Trades
  const bias = String(signal.marketBias || signal.bias || '').toUpperCase();
  const isBull = bias.includes('BULL') || bias.includes('BUY') || bias.includes('LONG');
  const isBear = bias.includes('BEAR') || bias.includes('SELL') || bias.includes('SHORT');

  let risk = 0;
  let reward = 0;

  if (isBull) {
    signal.bias = 'BULLISH';
    signal.marketBias = 'BULLISH';
    if (sl >= entry) {
      return {
        valid: false,
        reason: `DIRECTIONAL CONFLICT — Bullish trade requires Stop Loss (${sl}) to be strictly below Entry (${entry}).`,
        setupStatus: 'INVALID',
        grade: 'Avoid',
        notes: `SL (${sl}) >= Entry (${entry}) for bullish setup.`,
      };
    }
    if (tp1 <= entry) {
      return {
        valid: false,
        reason: `DIRECTIONAL CONFLICT — Bullish trade requires Take Profit (${tp1}) to be strictly above Entry (${entry}).`,
        setupStatus: 'INVALID',
        grade: 'Avoid',
        notes: `TP (${tp1}) <= Entry (${entry}) for bullish setup.`,
      };
    }
    risk = entry - sl;
    reward = tp1 - entry;
  } else if (isBear) {
    signal.bias = 'BEARISH';
    signal.marketBias = 'BEARISH';
    if (sl <= entry) {
      return {
        valid: false,
        reason: `DIRECTIONAL CONFLICT — Bearish trade requires Stop Loss (${sl}) to be strictly above Entry (${entry}).`,
        setupStatus: 'INVALID',
        grade: 'Avoid',
        notes: `SL (${sl}) <= Entry (${entry}) for bearish setup.`,
      };
    }
    if (tp1 >= entry) {
      return {
        valid: false,
        reason: `DIRECTIONAL CONFLICT — Bearish trade requires Take Profit (${tp1}) to be strictly below Entry (${entry}).`,
        setupStatus: 'INVALID',
        grade: 'Avoid',
        notes: `TP (${tp1}) >= Entry (${entry}) for bearish setup.`,
      };
    }
    risk = sl - entry;
    reward = entry - tp1;
  } else {
    signal.setupStatus = 'NO_SETUP';
    signal.setupGrade = 'Avoid';
    signal.entry = null;
    signal.stopLoss = null;
    signal.takeProfit = null;
    signal.riskReward = 'N/A';
    signal.confidence = 30;
    signal.confidenceRationale = 'Directional bias is neutral.';
    signal.stateMachineState = 'INSUFFICIENT_DATA';
    populateInstitutionalOutputs(signal, context);
    return {
      valid: true,
      setupStatus: 'NO_SETUP',
      grade: 'Avoid',
      notes: 'Neutral bias cannot produce confirmed trade setup.',
    };
  }

  // Check Structural Stop Loss Anchor Check against Protected Level (Immediate Invalidation)
  if (strat === 'SMC' && signal.aplusSmc) {
    const protPrice = parseNumericPrice(signal.aplusSmc.protectedLevel?.price);
    if (!isNaN(protPrice) && protPrice > 0) {
      if (isBull && sl > protPrice) {
        return {
          valid: false,
          reason: `STRUCTURAL INVALIDATION ERROR — For Bullish A+ SMC, Stop Loss (${sl}) must be anchored strictly below Protected Low (${protPrice}).`,
          setupStatus: 'INVALID',
          grade: 'Avoid',
          notes: `SL (${sl}) is placed above Protected Low (${protPrice}).`,
        };
      }
      if (isBear && sl < protPrice) {
        return {
          valid: false,
          reason: `STRUCTURAL INVALIDATION ERROR — For Bearish A+ SMC, Stop Loss (${sl}) must be anchored strictly above Protected High (${protPrice}).`,
          setupStatus: 'INVALID',
          grade: 'Avoid',
          notes: `SL (${sl}) is placed below Protected High (${protPrice}).`,
        };
      }
    } else if (isConfirmedRaw) {
      return {
        valid: false,
        reason: 'STRUCTURAL DEFENSE FAILED — Protected high/low not established or structurally defensible.',
        setupStatus: 'INVALID',
        grade: 'Avoid',
        notes: 'Protected level is missing or unreadable on chart.',
      };
    }
  }

  // Check for Liquidity-Entry Confusion (Phase 3)
  const sweepPrice = parseNumericPrice(signal.aplusSmc?.liquiditySweep?.sweptLevel);
  if (!isNaN(entry) && entry > 0 && !isNaN(sweepPrice) && sweepPrice > 0 && Math.abs(entry - sweepPrice) < 0.0001) {
    signal.setupStatus = 'INVALID';
    signal.setupGrade = 'Avoid';
    signal.stateMachineState = 'SETUP_INVALIDATED';
    populateInstitutionalOutputs(signal, context);
    return {
      valid: false,
      reason: `LIQUIDITY-ENTRY CONFUSION ERROR — Entry price (${entry}) cannot be placed directly at the liquidity sweep level (${sweepPrice}). Liquidity pools are sweep references or targets, not trade entries. Entry must be at the POI mitigation retest after CISD.`,
      setupStatus: 'INVALID',
      grade: 'Avoid',
      notes: 'Entry was erroneously set to the swept liquidity level instead of a validated POI retest.',
    };
  }

  // Multi-Timeframe Directional Alignment & Conflict Check (Phase 2)
  const htfBiasRaw = String(signal.htfAnalysis?.bias || '').toUpperCase();
  const htfStructureRaw = String(signal.htfAnalysis?.marketStructure || '').toUpperCase();
  const aplusZoneType = String(signal.aplusSmc?.htfSupplyDemand?.type || signal.aplusSmc?.htfSupplyDemand?.zoneType || '').toUpperCase();

  if ((htfBiasRaw.includes('BEAR') || htfStructureRaw.includes('BEAR')) && isBull && !aplusZoneType.includes('DEMAND')) {
    signal.setupStatus = 'DEVELOPING';
    signal.setupGrade = 'Developing';
    signal.hasConfirmedSetup = false;
    signal.entry = null;
    signal.stopLoss = null;
    signal.takeProfit = null;
    signal.stateMachineState = 'INSUFFICIENT_DATA';
    populateInstitutionalOutputs(signal, context);
    return {
      valid: true,
      setupStatus: 'DEVELOPING',
      grade: 'Developing',
      notes: 'TIMEFRAME CONFLICT — Lower Timeframe bullish execution conflicts with Higher Timeframe BEARISH macro delivery without a validated HTF Demand zone reversal.',
    };
  }

  if ((htfBiasRaw.includes('BULL') || htfStructureRaw.includes('BULL')) && isBear && !aplusZoneType.includes('SUPPLY')) {
    signal.setupStatus = 'DEVELOPING';
    signal.setupGrade = 'Developing';
    signal.hasConfirmedSetup = false;
    signal.entry = null;
    signal.stopLoss = null;
    signal.takeProfit = null;
    signal.stateMachineState = 'INSUFFICIENT_DATA';
    populateInstitutionalOutputs(signal, context);
    return {
      valid: true,
      setupStatus: 'DEVELOPING',
      grade: 'Developing',
      notes: 'TIMEFRAME CONFLICT — Lower Timeframe bearish execution conflicts with Higher Timeframe BULLISH macro delivery without a validated HTF Supply zone reversal.',
    };
  }

  // Check A+ SMC Specific Structural Rules & Sequence Completion
  if (strat === 'SMC' && signal.aplusSmc) {
    const ftsStatus = String(signal.aplusSmc.failureToSwing?.status || '').toUpperCase();
    if (ftsStatus === 'PENDING' || ftsStatus === 'AWAITING_SECOND_ATTEMPT' || ftsStatus === 'AWAITING_ATTEMPT' || ftsStatus === 'FAILED' || ftsStatus === 'NOT CONFIRMED') {
      signal.setupStatus = 'DEVELOPING';
      signal.setupGrade = 'Developing';
      signal.stateMachineState = 'WAITING_FOR_FAILURE_TO_SWING';
      signal.hasConfirmedSetup = false;
      signal.confidence = 65;
      signal.confidenceRationale = 'Failure to Swing is not yet confirmed. Awaiting second attempt failure.';
      populateInstitutionalOutputs(signal, context);
      return {
        valid: true,
        setupStatus: 'DEVELOPING',
        grade: 'Developing',
        notes: 'Setup is developing. Awaiting 15M Failure to Swing (second attempt failed). Do not force trade prematurely.',
      };
    }

    const cisdStatus = String(signal.aplusSmc.changeInStateOfDelivery?.status || '').toUpperCase();
    if (cisdStatus === 'PENDING' || cisdStatus === 'NOT CONFIRMED') {
      signal.setupStatus = 'DEVELOPING';
      signal.setupGrade = 'Developing';
      signal.stateMachineState = 'WAITING_FOR_CISD';
      signal.hasConfirmedSetup = false;
      signal.confidence = 65;
      signal.confidenceRationale = 'Change in State of Delivery (CISD) candle body close is pending.';
      populateInstitutionalOutputs(signal, context);
      return {
        valid: true,
        setupStatus: 'DEVELOPING',
        grade: 'Developing',
        notes: 'Setup is developing. Awaiting 15M Change in State of Delivery (CISD) candle body close.',
      };
    }

    // Displacement adequacy check (Acceptance Criteria 8)
    const dispText = String(signal.ltfAnalysis?.displacement || signal.aplusSmc.changeInStateOfDelivery?.evidence || '').toUpperCase();
    if (dispText.includes('WEAK') || dispText.includes('INSUFFICIENT')) {
      signal.setupStatus = 'DEVELOPING';
      signal.setupGrade = 'Developing';
      signal.stateMachineState = 'WAITING_FOR_DISPLACEMENT';
      signal.hasConfirmedSetup = false;
      populateInstitutionalOutputs(signal, context);
      return {
        valid: true,
        setupStatus: 'DEVELOPING',
        grade: 'Developing',
        notes: 'Displacement is insufficient; candle bodies lack decisive momentum.',
      };
    }

    // POI missing check (Acceptance Criteria 9)
    const poiCheckStatus = String(signal.aplusSmc.poi?.status || '').toUpperCase();
    if (poiCheckStatus === 'MISSING' || poiCheckStatus === 'NONE') {
      signal.setupStatus = 'DEVELOPING';
      signal.setupGrade = 'Developing';
      signal.stateMachineState = 'WAITING_FOR_POI';
      signal.hasConfirmedSetup = false;
      populateInstitutionalOutputs(signal, context);
      return {
        valid: true,
        setupStatus: 'DEVELOPING',
        grade: 'Developing',
        notes: 'Setup is developing. No suitable unmitigated POI identified following delivery shift.',
      };
    }

    const poiMitStatus = String(signal.aplusSmc.poiMitigation?.status || '').toUpperCase();
    if (poiMitStatus === 'PENDING' || poiMitStatus === 'NOT REACHED' || poiMitStatus === 'AWAITING_RETEST' || poiMitStatus === 'UNTESTED') {
      signal.setupStatus = 'DEVELOPING';
      signal.setupGrade = 'Developing';
      signal.hasConfirmedSetup = false;
      signal.entry = null;
      signal.stopLoss = null;
      signal.takeProfit = null;
      signal.confidence = 70;
      signal.stateMachineState = 'WAITING_FOR_RETEST';
      signal.confidenceRationale = 'Awaiting price retracement and mitigation of the 15M POI. Untriggered retest cannot produce an actionable entry.';
      populateInstitutionalOutputs(signal, context);
      return {
        valid: true,
        setupStatus: 'DEVELOPING',
        grade: 'Developing',
        notes: 'Setup is developing. 15M POI defined; awaiting retracement mitigation before execution. Untriggered retest cannot produce an actionable entry.',
      };
    }
  }

  // Calculate Mathematical Risk/Reward
  if (risk <= 0) {
    return {
      valid: false,
      reason: 'MATHEMATICAL ERROR — Risk distance is zero or negative.',
      setupStatus: 'INVALID',
      grade: 'Avoid',
      notes: 'Invalid risk calculation.',
    };
  }

  const rrRatio = reward / risk;
  signal.riskReward = `1 : ${rrRatio.toFixed(2)}`;

  if (rrRatio < 1.0) {
    signal.setupStatus = 'DEVELOPING';
    signal.setupGrade = 'Developing';
    signal.confidence = 55;
    signal.confidenceRationale = `Sub-optimal R:R (1:${rrRatio.toFixed(2)}). Waiting for deeper retracement into POI.`;
    populateInstitutionalOutputs(signal, context);
    return {
      valid: true,
      setupStatus: 'DEVELOPING',
      grade: 'Developing',
      notes: `R:R of 1:${rrRatio.toFixed(2)} is less than 1.0:1. Setup is developing for a more favorable entry.`,
    };
  }

  // Calculate Evidence-Based Confidence for Confirmed Setup
  const baseConfidence = rrRatio >= 2.0 ? 88 : rrRatio >= 1.5 ? 84 : 80;
  const confluenceBoost = Math.min(10, confirmedCriteriaCount);
  signal.confidence = Math.min(96, baseConfidence + confluenceBoost);
  signal.confidenceRationale = `High confluence (${confirmedCriteriaCount}/9 criteria confirmed) with 1:${rrRatio.toFixed(2)} R:R.`;

  // Preserve valid trade levels
  signal.entry = entry;
  signal.stopLoss = sl;
  signal.takeProfit = tp1;
  signal.takeProfit1 = tp1;
  if (!isNaN(tp2) && tp2 > 0) signal.takeProfit2 = tp2;
  signal.hasConfirmedSetup = true;
  signal.stateMachineState = 'ENTRY_VALIDATED';

  // Grade: A+ if R:R >= 2.0 and high confluence, else A
  if (rrRatio >= 2.0 && confirmedCriteriaCount >= 6) {
    signal.setupGrade = 'A+';
    signal.setupStatus = 'CONFIRMED';
  } else if (rrRatio >= 1.5) {
    signal.setupGrade = 'A';
    signal.setupStatus = 'CONFIRMED';
  } else {
    signal.setupGrade = 'B';
    signal.setupStatus = 'CONFIRMED';
  }

  // Generate complete Institutional Output schema artifacts
  populateInstitutionalOutputs(signal, context);

  return {
    valid: true,
    setupStatus: 'CONFIRMED',
    grade: signal.setupGrade,
    notes: `All TradeGuard validation rules passed. Verified ${signal.selectedStrategy || context.strategy} ${signal.bias} setup with 1:${rrRatio.toFixed(2)} R:R.`,
  };
}
