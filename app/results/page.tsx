"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppState } from "@/context/AppContext";
import { getInsight } from "@/lib/artefactInsights";
import type { Artefact } from "@/lib/decisionEngine";
import ScoreBar from "@/components/ScoreBar";
import InsightPanel from "@/components/InsightPanel";

const ARTEFACT_LABELS: Record<Artefact, string> = {
  prototype: "Prototype",
  visionFilm: "Vision Film",
  slideDeck: "Slide Deck",
};

const CONFIDENCE_LABEL = (c: number) =>
  c >= 80 ? "High confidence" : c >= 60 ? "Moderate confidence" : "Low confidence — review carefully";

const CONFIDENCE_COLOR = (c: number) =>
  c >= 80 ? "text-green-600 bg-green-50" : c >= 60 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";

export default function ResultsPage() {
  const router = useRouter();
  const { result, reset, bidSignals, bidFileName } = useAppState();

  useEffect(() => {
    if (!result) router.replace("/");
  }, [result, router]);

  if (!result) return null;

  const { recommendedArtefact, scores, confidence, reasoning, alternative } = result;
  const insight = getInsight(recommendedArtefact);
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
            <div className="flex items-center gap-4">
              <span className="text-5xl">{insight.icon}</span>
              <div>
                <h1 className="text-white text-3xl font-extrabold tracking-tight">{insight.title}</h1>
                <p className="text-blue-300 text-base mt-0.5">{insight.tagline}</p>
              </div>
            </div>
          </div>

          {/* Confidence */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-cap-bright transition-all duration-700 ease-out"
                style={{ width: `${confidence}%` }}
              />
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CONFIDENCE_COLOR(confidence)}`}>
              {confidence}% — {CONFIDENCE_LABEL(confidence)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Score breakdown ── */}
      <div className="bg-white rounded-2xl shadow-card p-7 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-cap-blue" />
          <h2 className="text-cap-navy font-bold text-lg">Score Breakdown</h2>
        </div>
        <div className="flex flex-col gap-4">
          <ScoreBar label="🛠️  Prototype"   score={scores.prototype}  highlighted={recommendedArtefact === "prototype"} />
          <ScoreBar label="🎬  Vision Film" score={scores.visionFilm} highlighted={recommendedArtefact === "visionFilm"} />
          <ScoreBar label="📊  Slide Deck"  score={scores.slideDeck}  highlighted={recommendedArtefact === "slideDeck"} />
        </div>
      </div>

      {/* ── Document signals ── */}
      {bidSignals && bidSignals.detectedThemes.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card p-7 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-purple-500" />
            <h2 className="text-cap-navy font-bold text-lg">Signals from your bid document</h2>
            {bidFileName && (
              <span className="ml-auto text-xs text-cap-muted truncate max-w-[140px]">{bidFileName}</span>
            )}
          </div>
          <p className="text-cap-muted text-sm leading-relaxed">{bidSignals.summary}</p>
          <div className="flex flex-col gap-2">
            {bidSignals.detectedThemes.map((theme, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-cap-bg px-4 py-3">
                <span className="text-lg shrink-0">{theme.icon}</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-cap-navy font-semibold text-sm">{theme.label}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      theme.strength === "strong" ? "bg-cap-light text-cap-blue" : "bg-gray-100 text-cap-muted"
                    }`}>
                      {theme.strength === "strong" ? "Strong signal" : "Moderate"}
                    </span>
                  </div>
                  <p className="text-cap-muted text-xs mt-0.5">{theme.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Reasoning ── */}
      <div className="bg-white rounded-2xl shadow-card p-7 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-cap-blue" />
          <h2 className="text-cap-navy font-bold text-lg">Why this recommendation</h2>
        </div>

        <ul className="flex flex-col gap-3">
          {reasoning.filter(r => !r.startsWith("⚠️")).map((r, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-cap-muted leading-relaxed">{r}</span>
            </li>
          ))}
        </ul>

        {reasoning.filter(r => r.startsWith("⚠️")).map((r, i) => (
          <div key={i} className="flex gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
            <span className="text-amber-500 shrink-0 text-base">⚠</span>
            <p className="text-amber-800 text-sm leading-relaxed">{r.replace("⚠️ ", "")}</p>
          </div>
        ))}
      </div>

      {/* ── Consultancy insights ── */}
      <InsightPanel insight={insight} />

      {/* ── Alternative ── */}
      {alternative && altInsight && (
        <div className="bg-white rounded-2xl shadow-card p-7 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-amber-400" />
            <h2 className="text-cap-navy font-bold text-lg">Close Alternative</h2>
          </div>
          <p className="text-cap-muted text-sm">Scores were close — this artefact is worth considering if circumstances change.</p>
          <div className="rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{altInsight.icon}</span>
              <div>
                <p className="font-bold text-cap-navy text-sm">{ARTEFACT_LABELS[alternative]}</p>
                <p className="text-cap-muted text-xs">{altInsight.tagline}</p>
              </div>
              <span className="ml-auto text-sm font-bold text-cap-blue">{scores[alternative]}</span>
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