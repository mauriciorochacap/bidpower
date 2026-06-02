"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppState } from "@/context/AppContext";
import { getInsight } from "@/lib/artefactInsights";
import type { Artefact, CriteriaResult, ArtefactRationale } from "@/lib/decisionEngine";
import type { UserAnswers } from "@/lib/decisionEngine";
import InsightPanel from "@/components/InsightPanel";

const ARTEFACT_LABELS: Record<Artefact | "none", string> = {
  prototype: "Prototype",
  visionFilm: "Vision Film",
  slideDeck: "Slide Deck",
  none: "No additional artefact",
};

const ARTEFACT_ICONS: Record<Artefact | "none", string> = {
  prototype: "🛠️",
  visionFilm: "🎬",
  slideDeck: "📊",
  none: "✕",
};

const CONFIDENCE_STYLE = (c: string) =>
  c === "high"   ? "text-green-700 bg-green-50 border-green-200" :
  c === "medium" ? "text-amber-700 bg-amber-50 border-amber-200" :
                   "text-red-700 bg-red-50 border-red-200";

// ── Expandable criterion row ──────────────────────────────────────────────

function CriterionRow({ item, met }: { item: { label: string; because: string }; met: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex gap-2 items-start text-sm text-left w-full group"
      >
        <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${met ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
          {met ? (
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </span>
        <span className={`flex-1 leading-relaxed ${met ? "text-cap-muted" : "text-cap-muted opacity-70 line-through"}`}>{item.label}</span>
        <svg className={`w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="ml-6 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
          <p className="text-cap-muted text-xs leading-relaxed">
            <span className="font-semibold text-cap-navy">Because: </span>
            {item.because}
          </p>
        </div>
      )}
    </div>
  );
}

function CriteriaBlock({ label, criteria }: { label: string; criteria: CriteriaResult }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-cap-navy font-semibold text-sm">{label}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${criteria.isValid ? "bg-green-50 text-green-700" : "bg-gray-100 text-cap-muted"}`}>
          {criteria.metCount}/{criteria.requiredCount} criteria met
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {criteria.met.map((c, i) => (
          <CriterionRow key={i} item={c} met={true} />
        ))}
        {criteria.notMet.map((c, i) => (
          <CriterionRow key={i} item={c} met={false} />
        ))}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function formatAnswerEvidence(answers: Partial<UserAnswers>): Array<{ label: string; value: string }> {
  const items: Array<{ label: string; value: string }> = [];
  const scaleMap = (v: number) => v === 3 ? "High" : v === 2 ? "Medium" : "Low";
  if (answers.decisionInfluence !== undefined) {
    items.push({ label: "Client experience need", value: scaleMap(answers.decisionInfluence) });
  }
  if (answers.uncertaintyType !== undefined) {
    const m = { technical: "Technical", commercial: "Commercial", belief: "Belief / vision", none: "None (low-risk bid)" };
    items.push({ label: "Primary uncertainty", value: m[answers.uncertaintyType] });
  }
  if (answers.beliefShiftRequired !== undefined) {
    items.push({ label: "Belief shift required", value: scaleMap(answers.beliefShiftRequired) });
  }
  if (answers.decisionNature !== undefined) {
    const m = { logical: "Logical — evidence-based", mixed: "Mixed", persuasive: "Emotional — belief-based" };
    items.push({ label: "Decision nature", value: m[answers.decisionNature] });
  }
  if (answers.feasibility !== undefined) {
    items.push({ label: "Build feasibility", value: scaleMap(answers.feasibility) });
  }
  if (answers.differentiationClarity !== undefined) {
    items.push({ label: "Differentiation clarity", value: scaleMap(answers.differentiationClarity) });
  }
  if (answers.emotionalImpact !== undefined) {
    items.push({ label: "Emotional story strength", value: scaleMap(answers.emotionalImpact) });
  }
  if (answers.narrativeStrength !== undefined) {
    items.push({ label: "Transformation narrative", value: scaleMap(answers.narrativeStrength) });
  }
  if (answers.futureStateClarity !== undefined) {
    items.push({ label: "Future state clarity", value: scaleMap(answers.futureStateClarity) });
  }
  if (answers.proofOfOutcome !== undefined) {
    items.push({ label: "Proof of outcome available", value: scaleMap(answers.proofOfOutcome) });
  }
  if (answers.stakeholderType !== undefined) {
    const m = { executive: "Executive", operational: "Operational", mixed: "Mixed audience" };
    items.push({ label: "Decision-maker type", value: m[answers.stakeholderType] });
  }
  return items;
}

function deriveMissingInfo(
  answers: Partial<UserAnswers>,
  bidAnalysis: { interpretation: { confidence: string } } | null,
  bidFileName: string,
  whyUs: string
): string[] {
  const missing: string[] = [];
  if (!bidFileName) missing.push("No bid document uploaded — signals estimated from answers and context only");
  if (!whyUs) missing.push("Winning themes not provided — differentiation analysis uses defaults only");
  if (!answers.stakeholderType) missing.push("Decision-maker type not confirmed");
  if (bidAnalysis?.interpretation.confidence === "low") {
    missing.push("Bid document signals have low confidence — document may be too short or ambiguous");
  }
  if (!answers.differentiationClarity) missing.push("Competitor differentiation position unknown");
  return missing;
}

// ── Artefact comparison card ──────────────────────────────────────────────

function ArtefactCard({ id, rationale }: { id: Artefact | "none"; rationale: ArtefactRationale }) {
  const [open, setOpen] = useState(false);
  const label = ARTEFACT_LABELS[id];
  const icon = ARTEFACT_ICONS[id];
  return (
    <div className={`rounded-xl border px-4 py-4 flex flex-col gap-2 ${rationale.qualified ? "border-green-200 bg-green-50/40" : "border-gray-200 bg-white"}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="font-semibold text-cap-navy text-sm flex-1">{label}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rationale.qualified ? "bg-green-100 text-green-700" : "bg-gray-100 text-cap-muted"}`}>
          {rationale.qualified ? "Qualifies" : "Does not qualify"}
        </span>
      </div>
      <p className="text-cap-muted text-xs leading-relaxed">{rationale.reason}</p>
      <button
        onClick={() => setOpen(o => !o)}
        className="text-cap-blue text-xs font-medium hover:underline text-left flex items-center gap-1 w-fit"
      >
        When would this be the better choice?
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
          <p className="text-cap-muted text-xs leading-relaxed">{rationale.whenBetter}</p>
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const { result, reset, bidAnalysis, bidFileName, whyUs, answers } = useAppState();

  useEffect(() => {
    if (!result) router.replace("/");
  }, [result, router]);

  if (!result) return null;

  const { decisionState, recommendedArtefact, confidence, confidenceScore, confidenceDetail, criteriaEvaluation, artefactComparison, reasoning, alternative, whatToDoNext } = result;

  const hasRecommendation = decisionState === "recommend" && recommendedArtefact !== "none";
  const insight = hasRecommendation ? getInsight(recommendedArtefact as Artefact) : null;

  const answerEvidence = formatAnswerEvidence(answers);
  const missingInfo = deriveMissingInfo(answers, bidAnalysis, bidFileName, whyUs);

  function handleRestart() {
    reset();
    router.push("/");
  }

  return (
    <div className="flex flex-col gap-10 max-w-2xl mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-cap-muted">
        <Link href="/" className="hover:text-cap-blue transition-colors">Home</Link>
        <span>›</span>
        <span className="hover:text-cap-blue cursor-pointer transition-colors" onClick={() => router.push("/questionnaire")}>Assessment</span>
        <span>›</span>
        <span className="text-cap-navy font-medium">Results</span>
      </div>

      {/* ── Hero recommendation ── */}
      <div className="bg-cap-navy rounded-2xl overflow-hidden shadow-card">
        <div className="px-8 py-6 flex flex-col gap-5">
          <div>
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-3">Our recommendation</p>
            {hasRecommendation && insight ? (
              <div className="flex items-center gap-4">
                <span className="text-5xl">{insight.icon}</span>
                <div>
                  <h1 className="text-white text-3xl font-extrabold tracking-tight">{insight.title}</h1>
                  <p className="text-blue-300 text-base mt-0.5">{insight.tagline}</p>
                </div>
              </div>
            ) : decisionState === "do_not_build" ? (
              <div className="flex items-center gap-4">
                <span className="text-5xl">🚫</span>
                <div>
                  <h1 className="text-white text-3xl font-extrabold tracking-tight">Don&apos;t build yet</h1>
                  <p className="text-blue-300 text-base mt-0.5">The signals don&apos;t justify the investment right now</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-5xl">🔍</span>
                <div>
                  <h1 className="text-white text-3xl font-extrabold tracking-tight">More information needed</h1>
                  <p className="text-blue-300 text-base mt-0.5">Key questions remain unanswered</p>
                </div>
              </div>
            )}
          </div>

          {/* Confidence section */}
          <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${CONFIDENCE_STYLE(confidence)}`}>
                {confidence === "high" ? "High" : confidence === "medium" ? "Medium" : "Low"} confidence: {confidenceScore}%
              </span>
            </div>
            <p className="text-blue-200 text-xs leading-relaxed">{confidenceDetail.reason}</p>
          </div>
        </div>
      </div>

      {/* ── Reasoning ── */}
      <div className="bg-white rounded-2xl shadow-card p-7 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-cap-blue" />
          <h2 className="text-cap-navy font-bold text-lg">Why this recommendation</h2>
        </div>
        <p className="text-cap-muted text-sm leading-relaxed">{reasoning}</p>
      </div>

      {/* ── Evidence used ── */}
      <div className="bg-white rounded-2xl shadow-card p-7 flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-indigo-500" />
          <h2 className="text-cap-navy font-bold text-lg">Evidence used</h2>
        </div>

        {/* From answers */}
        {answerEvidence.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-cap-navy font-semibold text-xs uppercase tracking-wide">From your answers</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {answerEvidence.map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-100 px-3 py-2">
                  <span className="text-cap-muted text-xs flex-1">{item.label}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    item.value.toLowerCase().startsWith("high") ? "bg-cap-light text-cap-blue" :
                    item.value.toLowerCase().startsWith("low") ? "bg-gray-100 text-cap-muted" :
                    item.value.toLowerCase().startsWith("none") ? "bg-gray-100 text-cap-muted" :
                    "bg-amber-50 text-amber-700"
                  }`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* From bid document */}
        {bidAnalysis && bidAnalysis.interpretation.signalSummaries.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-cap-navy font-semibold text-xs uppercase tracking-wide">
              From the bid document
              {bidFileName && <span className="ml-2 font-normal normal-case text-cap-muted">({bidFileName})</span>}
            </p>
            <div className="flex flex-col gap-1.5">
              {bidAnalysis.interpretation.signalSummaries.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-cap-muted leading-relaxed">
                  <span className="text-cap-blue shrink-0 mt-0.5">•</span>
                  <span><span className="font-semibold text-cap-navy">{s.label}:</span> {s.plain}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assumptions */}
        {bidAnalysis && bidAnalysis.interpretation.assumptions.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-cap-navy font-semibold text-xs uppercase tracking-wide">Assumptions</p>
            <div className="flex flex-col gap-1.5">
              {bidAnalysis.interpretation.assumptions.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-cap-muted leading-relaxed">
                  <span className="text-amber-500 shrink-0 mt-0.5">•</span>
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confidence detail */}
        {(confidenceDetail.increasers.length > 0 || confidenceDetail.reducers.length > 0) && (
          <div className="flex flex-col gap-3">
            {confidenceDetail.reducers.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-cap-navy font-semibold text-xs uppercase tracking-wide">Missing information that reduced confidence</p>
                {confidenceDetail.reducers.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-red-700 leading-relaxed">
                    <span className="text-red-400 shrink-0 mt-0.5">•</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            )}
            {confidenceDetail.increasers.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-cap-navy font-semibold text-xs uppercase tracking-wide">What would increase confidence</p>
                {confidenceDetail.increasers.map((inc, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-green-700 leading-relaxed">
                    <span className="text-green-500 shrink-0 mt-0.5">•</span>
                    <span>{inc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Missing info */}
        {missingInfo.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-cap-navy font-semibold text-xs uppercase tracking-wide">Information not available</p>
            {missingInfo.map((m, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-cap-muted leading-relaxed">
                <span className="text-gray-400 shrink-0 mt-0.5">•</span>
                <span>{m}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Qualification criteria ── */}
      <div className="bg-white rounded-2xl shadow-card p-7 flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-cap-blue" />
          <h2 className="text-cap-navy font-bold text-lg">Qualification Criteria</h2>
          <p className="text-cap-muted text-xs ml-1">Click any criterion to see the reasoning</p>
        </div>
        <CriteriaBlock label="🛠️  Prototype" criteria={criteriaEvaluation.prototype} />
        <div className="border-t border-gray-100" />
        <CriteriaBlock label="🎬  Vision Film" criteria={criteriaEvaluation.visionFilm} />
      </div>

      {/* ── All options considered ── */}
      {artefactComparison && (
        <div className="bg-white rounded-2xl shadow-card p-7 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-purple-500" />
            <h2 className="text-cap-navy font-bold text-lg">All options considered</h2>
          </div>
          <div className="flex flex-col gap-3">
            <ArtefactCard id="prototype" rationale={artefactComparison.prototype} />
            <ArtefactCard id="visionFilm" rationale={artefactComparison.visionFilm} />
            <ArtefactCard id="slideDeck" rationale={artefactComparison.slideDeck} />
            <ArtefactCard id="none" rationale={artefactComparison.none} />
          </div>
        </div>
      )}

      {/* ── What to do next ── */}
      {whatToDoNext.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card p-7 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-green-500" />
            <h2 className="text-cap-navy font-bold text-lg">What to do next</h2>
          </div>
          <ol className="flex flex-col gap-3">
            {whatToDoNext.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="font-bold text-cap-blue shrink-0 w-4">{i + 1}.</span>
                <span className="text-cap-muted leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── Winning themes ── */}
      {whyUs && (
        <div className="bg-white rounded-2xl shadow-card p-7 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-amber-400" />
            <h2 className="text-cap-navy font-bold text-lg">Winning themes used in this analysis</h2>
          </div>
          <p className="text-cap-muted text-sm leading-relaxed whitespace-pre-wrap">{whyUs}</p>
        </div>
      )}

      {/* ── Consultant perspective ── */}
      {insight && <InsightPanel insight={insight} />}

      {/* ── Actions ── */}
      <div className="flex gap-3 pt-2 border-t border-gray-200">
        <button
          onClick={handleRestart}
          className="flex-1 rounded border border-gray-300 px-5 py-3 font-medium text-cap-muted text-sm hover:border-cap-blue hover:text-cap-blue transition-colors"
        >
          ← Start Again
        </button>
        <Link
          href="/questionnaire"
          className="flex-1 text-center rounded bg-cap-blue text-white px-5 py-3 font-semibold text-sm hover:bg-cap-navy transition-colors shadow-card"
        >
          Retake Assessment
        </Link>
      </div>

    </div>
  );
}
