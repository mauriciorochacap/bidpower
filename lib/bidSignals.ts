/**
 * bidSignals.ts
 *
 * Type definitions for the LLM-extracted signal layer.
 * Signals are produced by /api/interpret (OpenAI) and consumed
 * by the question selector and qualification-based decision engine.
 *
 * Three layers (kept strictly separate):
 *   1. DocumentSignals  — raw extracted values
 *   2. Interpretation   — human-readable explanation of those signals
 *   3. BidAnalysis      — combined output from the API
 */

export type SignalLevel = "low" | "medium" | "high";
export type DecisionType = "proof" | "persuasion" | "compliance";
export type StakeholderType = "executive" | "operational" | "mixed";

/** Structured signals extracted from the bid document by the LLM */
export interface DocumentSignals {
  /** Nature of the buying decision */
  decisionType: DecisionType;
  /** Level of technical/delivery uncertainty in the bid */
  uncertainty: SignalLevel;
  /** How much the client needs to change their thinking */
  beliefGap: SignalLevel;
  /** How hard the solution is to explain */
  complexity: SignalLevel;
  /** How important winning this bid is strategically */
  strategicValue: SignalLevel;
  /** Primary decision-maker profile */
  stakeholderType: StakeholderType;
  /** How much time realistically exists to build an artefact */
  timeFeasibility: SignalLevel;
  /** How much differentiation is required to win */
  differentiationNeed: SignalLevel;
}

/** Plain-language summary of a single extracted signal */
export interface SignalSummary {
  label: string;
  value: string;
  /** One sentence explaining the signal in plain language */
  plain: string;
}

/** LLM interpretation layer — explains signals, not the decision itself */
export interface Interpretation {
  /** Plain statement of the decision type */
  decisionType: string;
  /** Plain statement of the uncertainty level */
  uncertainty: string;
  /** Overall confidence in the interpretation */
  confidence: "low" | "medium" | "high";
  /** Assumptions the LLM had to make due to ambiguous content */
  assumptions: string[];
  /** One plain sentence per signal */
  signalSummaries: SignalSummary[];
}

/** Combined output from the /api/interpret endpoint */
export interface BidAnalysis {
  signals: DocumentSignals;
  interpretation: Interpretation;
}

/** Fallback signals used when no document is uploaded */
export function defaultSignals(): DocumentSignals {
  return {
    decisionType: "persuasion",
    uncertainty: "medium",
    beliefGap: "medium",
    complexity: "medium",
    strategicValue: "medium",
    stakeholderType: "mixed",
    timeFeasibility: "medium",
    differentiationNeed: "medium",
  };
}

