"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppState } from "@/context/AppContext";
import { getInsight } from "@/lib/artefactInsights";
import type { Artefact, CriteriaResult } from "@/lib/decisionEngine";
import InsightPanel from "@/components/InsightPanel";

const ARTEFACT_LABELS: Record<Artefact, string> = {
  prototype: "Prototype",
  visionFilm: "Vision Film",
  slideDeck: "Slide Deck",
};

const CONFIDENCE_STYLE = (c: string) =>
  c === "high"   ? "text-green-600 bg-green-50 border-green-200" :
  c === "medium" ? "text-amber-600 bg-amber-50 border-amber-200" :
                   "text-red-600 bg-red-50 border-red-200";

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
          <div key={i} className="flex gap-2 items-start text-sm">
            <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span className="text-cap-muted leading-relaxed">{c}</span>
          </div>
        ))}
        {criteria.notMet.map((c, i) => (
          <div key={i} className="flex gap-2 items-start text-sm">
            <span className="w-4 h-4 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
            <span className="text-cap-muted leading-relaxed line-through opacity-60">{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const { result, reset, bidAnalysis, bidFileName, whyUs } = useAppState();

  useEffect(() => {
    if (!result) router.replace("/");
  }, [result, router]);

  if (!result) return null;

  const { decisionState, recommendedArtefact, confidence, criteriaEvaluation, reasoning, whyNotOthers, alternative, whatToDoNext } = result;

  const hasRecommendation = decisionState === "recommend" && recommendedArtefact !== "none";
  const insight = hasRecommendation ? getInsight(recommendedArtefact as Artefact) : null;
  const altInsight = alternative ? getInsight(alternative) : null;

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

          {/* Confidence badge */}
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${CONFIDENCE_STYLE(confidence)}`}>
              {confidence === "high" ? "High confidence" : confidence === "medium" ? "Medium confidence" : "Low confidence — review carefully"}
            </span>
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
        {whyNotOthers && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
            <p className="text-cap-muted text-xs font-semibold uppercase tracking-wide mb-1">Why not the others?</p>
            <p className="text-cap-muted text-sm leading-relaxed">{whyNotOthers}</p>
          </div>
        )}
      </div>

      {/* ── Qualification criteria ── */}
      <div className="bg-white rounded-2xl shadow-card p-7 flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-cap-blue" />
          <h2 className="text-cap-navy font-bold text-lg">Qualification Criteria</h2>
        </div>
        <CriteriaBlock label="🛠️  Prototype" criteria={criteriaEvaluation.prototype} />
        <div className="border-t border-gray-100" />
        <CriteriaBlock label="🎬  Vision Film" criteria={criteriaEvaluation.visionFilm} />
      </div>

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

      {/* ── Document signals ── */}
      {bidAnalysis && bidAnalysis.interpretation.signalSummaries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card p-7 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-purple-500" />
            <h2 className="text-cap-navy font-bold text-lg">Signals from your bid document</h2>
            {bidFileName && (
              <span className="ml-auto text-xs text-cap-muted truncate max-w-[140px]">{bidFileName}</span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {bidAnalysis.interpretation.signalSummaries.map((s, i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-cap-bg px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-cap-navy font-semibold text-xs">{s.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.value === "high" ? "bg-cap-light text-cap-blue" :
                    s.value === "low" ? "bg-gray-100 text-cap-muted" :
                    "bg-amber-50 text-amber-700"
                  }`}>{s.value}</span>
                </div>
                <p className="text-cap-muted text-xs leading-relaxed">{s.plain}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Consultant perspective ── */}
      {insight && <InsightPanel insight={insight} />}

      {/* ── Alternative ── */}
      {alternative && altInsight && (
        <div className="bg-white rounded-2xl shadow-card p-7 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-amber-400" />
            <h2 className="text-cap-navy font-bold text-lg">Close Alternative</h2>
          </div>
          <p className="text-cap-muted text-sm">This artefact was close — worth considering if circumstances change.</p>
          <div className="rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{altInsight.icon}</span>
              <div>
                <p className="font-bold text-cap-navy text-sm">{ARTEFACT_LABELS[alternative]}</p>
                <p className="text-cap-muted text-xs">{altInsight.tagline}</p>
              </div>
            </div>
            <p className="text-cap-muted text-sm leading-relaxed border-t border-gray-100 pt-3">{altInsight.whyRecommended}</p>
          </div>
        </div>
      )}

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
