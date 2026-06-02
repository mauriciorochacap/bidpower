"use client";

import { useState, useRef, useCallback } from "react";
import { extractTextFromFile, SUPPORTED_TYPES, SUPPORTED_LABEL } from "@/lib/documentParser";
import type { BidAnalysis } from "@/lib/bidSignals";

interface UploadStepProps {
  onComplete: (text: string, fileName: string, analysis: BidAnalysis, whyUs: string) => void;
  onSkip: () => void;
}

type FileState = "idle" | "dragging" | "extracting" | "ready" | "error";

export default function UploadStep({ onComplete, onSkip }: UploadStepProps) {
  const [fileState, setFileState] = useState<FileState>("idle");
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState("");
  const [whyUs, setWhyUs] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setFileState("extracting");
    setErrorMsg("");
    try {
      const text = await extractTextFromFile(file);
      setRawText(text);
      setFileState("ready");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to read document.");
      setFileState("error");
    }
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setFileState("idle");
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  async function handleContinue() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText, whyUs }),
      });
      const analysis: BidAnalysis = await res.json();
      onComplete(rawText, fileName, analysis, whyUs);
    } catch {
      onComplete(rawText, fileName, { signals: null, interpretation: null } as unknown as BidAnalysis, whyUs);
    } finally {
      setSubmitting(false);
    }
  }

  const canContinue = whyUs.trim().length >= 20 && !submitting;
  const isDragging = fileState === "dragging";
  const isExtracting = fileState === "extracting";
  const hasDoc = fileState === "ready";

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 bg-cap-light border border-blue-200 rounded-full px-3 py-1 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-cap-blue"></span>
          <span className="text-cap-blue text-xs font-semibold uppercase tracking-widest">Step 1 of 2</span>
        </div>
        <h2 className="text-2xl font-bold text-cap-navy tracking-tight">Tell us about your bid</h2>
        <div className="rounded-xl bg-cap-light border border-blue-200 px-4 py-3">
          <p className="text-cap-navy text-sm font-semibold leading-snug">
            We&apos;ll recommend whether a deck, clickable prototype, video, or no additional artefact is likely to improve your chances of winning — and explain why.
          </p>
          <p className="text-cap-muted text-xs mt-1 leading-relaxed">
            The more context you give, the more confident and specific the recommendation.
          </p>
        </div>
      </div>

      {/* Why Us section */}
      <div className="flex flex-col gap-2">
        <label className="text-cap-navy font-semibold text-sm">
          Why are you well placed to win this bid? <span className="text-cap-blue">*</span>
        </label>
        <p className="text-cap-muted text-xs leading-relaxed">
          This helps assess your differentiation, how much the buyer already trusts your approach, what proof you can offer, and where the real win themes lie.
          You don&apos;t need to be comprehensive — focus on what&apos;s most distinctive about your position.
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {["Relevant experience", "Key differentiators", "Client relationship", "Proof points or case studies", "Risks or uncertainties"].map(hint => (
            <span key={hint} className="text-xs bg-gray-100 text-cap-muted px-2.5 py-1 rounded-full border border-gray-200">
              {hint}
            </span>
          ))}
        </div>
        <textarea
          value={whyUs}
          onChange={e => setWhyUs(e.target.value)}
          placeholder="e.g. We have delivered three similar transformation programmes in the public sector, giving us deep familiarity with the challenges this client faces. Our team includes the only accredited practitioners of this methodology in the UK. Our most relevant case study — [Client X] — achieved outcomes that directly mirror the objectives of this bid, including a 40% reduction in processing time and measurable staff adoption…"
          rows={6}
          className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-cap-navy placeholder:text-gray-400 focus:outline-none focus:border-cap-blue transition-colors resize-none leading-relaxed mt-1"
        />
        <div className="flex justify-between">
          <p className={`text-xs ${whyUs.trim().length < 20 ? "text-cap-muted" : "text-green-600 font-medium"}`}>
            {whyUs.trim().length < 20
              ? `${Math.max(0, 20 - whyUs.trim().length)} more characters to unlock Continue`
              : "✓ Ready"}
          </p>
          <p className="text-xs text-cap-muted">{whyUs.length} chars</p>
        </div>
      </div>

      {/* Bid document section */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-cap-navy font-semibold text-sm">
            Bid document <span className="text-cap-muted font-normal">(optional)</span>
          </p>
          <p className="text-cap-muted text-xs leading-relaxed mt-1">
            Upload the RFP or bid brief for even sharper signal detection. Supports {SUPPORTED_LABEL}.
          </p>
        </div>

        {/* Upload zone */}
        {!hasDoc && !isExtracting && (
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setFileState("dragging"); }}
            onDragLeave={() => setFileState("idle")}
            onClick={() => inputRef.current?.click()}
            className={`rounded-xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200
              ${isDragging ? "border-cap-blue bg-cap-light" : "border-gray-200 bg-white hover:border-cap-blue hover:bg-cap-light"}
            `}
          >
            <input ref={inputRef} type="file" accept={SUPPORTED_TYPES} onChange={handleFileChange} className="hidden" />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDragging ? "bg-cap-blue" : "bg-cap-light"}`}>
              <svg className={`w-5 h-5 transition-colors ${isDragging ? "text-white" : "text-cap-blue"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-cap-navy font-semibold text-sm">
              {isDragging ? "Drop to upload" : "Drag & drop or click to browse"}
            </p>
          </div>
        )}

        {/* Extracting */}
        {isExtracting && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-center gap-4">
            <div className="w-7 h-7 rounded-full border-4 border-cap-blue border-t-transparent animate-spin shrink-0" />
            <p className="text-cap-navy text-sm font-medium">Reading {fileName}…</p>
          </div>
        )}

        {/* Doc ready badge */}
        {hasDoc && (
          <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4">
            <div className="w-9 h-9 rounded-lg bg-cap-light flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-cap-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-cap-navy font-semibold text-sm truncate">{fileName}</p>
              <p className="text-cap-muted text-xs">Document ready</p>
            </div>
            <span className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-semibold">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              Ready
            </span>
            <button
              onClick={() => { setFileState("idle"); setRawText(""); setFileName(""); }}
              className="text-cap-muted hover:text-red-500 transition-colors ml-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* File error */}
        {fileState === "error" && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex gap-3">
            <span className="text-red-500 text-lg shrink-0">✕</span>
            <div className="flex flex-col gap-1">
              <p className="text-red-800 font-semibold text-sm">Could not read document</p>
              <p className="text-red-600 text-sm">{errorMsg}</p>
              <button onClick={() => setFileState("idle")} className="text-cap-blue text-sm font-medium hover:underline w-fit mt-1">
                Try again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Analysing overlay */}
      {submitting && (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 flex flex-col items-center gap-4 shadow-card">
          <div className="w-12 h-12 rounded-full border-4 border-cap-blue border-t-transparent animate-spin" />
          <p className="text-cap-navy font-semibold text-sm">Analysing your context with AI…</p>
          <p className="text-cap-muted text-xs text-center max-w-xs">
            Combining your winning themes{hasDoc ? " and bid document" : ""} to extract the most relevant signals.
          </p>
        </div>
      )}

      {/* Actions */}
      {!submitting && (
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-200">
          <button
            onClick={onSkip}
            className="flex-1 rounded border border-gray-300 px-5 py-3 font-medium text-cap-muted text-sm hover:border-cap-blue hover:text-cap-blue transition-colors"
          >
            Skip — proceed with reduced confidence
          </button>
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className={`flex-1 rounded px-5 py-3 font-semibold text-sm transition-colors inline-flex items-center justify-center gap-2
              ${canContinue ? "bg-cap-blue text-white hover:bg-cap-navy shadow-card" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
          >
            Continue to questions
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
