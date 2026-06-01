"use client";

import { useState, useRef, useCallback } from "react";
import { extractTextFromFile, SUPPORTED_TYPES, SUPPORTED_LABEL } from "@/lib/documentParser";
import type { BidAnalysis } from "@/lib/bidSignals";

interface UploadStepProps {
  onComplete: (text: string, fileName: string, analysis: BidAnalysis) => void;
  onSkip: () => void;
}

type UploadState = "idle" | "dragging" | "extracting" | "interpreting" | "done" | "error";

export default function UploadStep({ onComplete, onSkip }: UploadStepProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState("");
  const [analysis, setAnalysis] = useState<BidAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setUploadState("extracting");
    setErrorMsg("");
    try {
      // Step 1: Extract raw text
      const text = await extractTextFromFile(file);
      // Step 2: LLM interpretation
      setUploadState("interpreting");
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const bidAnalysis: BidAnalysis = await res.json();
      setAnalysis(bidAnalysis);
      setUploadState("done");
      onComplete(text, file.name, bidAnalysis);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to read document.");
      setUploadState("error");
    }
  }, [onComplete]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setUploadState("idle");
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setUploadState("dragging");
  }

  function handleDragLeave() {
    setUploadState("idle");
  }

  const isDragging = uploadState === "dragging";
  const isProcessing = uploadState === "extracting" || uploadState === "interpreting";
  const isDone = uploadState === "done";
  const isError = uploadState === "error";

  const confidenceColour = (c: string) =>
    c === "high" ? "text-green-600 bg-green-50" :
    c === "medium" ? "text-amber-600 bg-amber-50" :
    "text-red-600 bg-red-50";

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 bg-cap-light border border-blue-200 rounded-full px-3 py-1 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-cap-blue"></span>
          <span className="text-cap-blue text-xs font-semibold uppercase tracking-widest">Step 1 of 2</span>
        </div>
        <h2 className="text-2xl font-bold text-cap-navy tracking-tight">Upload your bid document</h2>
        <p className="text-cap-muted text-sm leading-relaxed">
          Our AI reads your bid to extract key signals — so the questions that follow are tailored to your situation.
          Supports {SUPPORTED_LABEL} files.
        </p>
      </div>

      {/* Upload zone */}
      {!isDone && !isProcessing && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200
            ${isDragging ? "border-cap-blue bg-cap-light scale-[1.01]" : "border-gray-300 bg-white hover:border-cap-blue hover:bg-cap-light"}
          `}
        >
          <input ref={inputRef} type="file" accept={SUPPORTED_TYPES} onChange={handleFileChange} className="hidden" />
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isDragging ? "bg-cap-blue" : "bg-cap-light"}`}>
            <svg className={`w-6 h-6 transition-colors ${isDragging ? "text-white" : "text-cap-blue"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-cap-navy font-semibold text-sm">{isDragging ? "Drop to upload" : "Drag & drop your bid document"}</p>
            <p className="text-cap-muted text-xs mt-1">or click to browse — PDF, DOCX, TXT</p>
          </div>
        </div>
      )}

      {/* Processing state */}
      {isProcessing && (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 flex flex-col items-center gap-4 shadow-card">
          <div className="w-12 h-12 rounded-full border-4 border-cap-blue border-t-transparent animate-spin" />
          <p className="text-cap-navy font-semibold text-sm">
            {uploadState === "extracting" ? `Reading ${fileName}…` : "Interpreting bid signals with AI…"}
          </p>
          <p className="text-cap-muted text-xs text-center max-w-xs">
            {uploadState === "interpreting"
              ? "Our AI is identifying the decision type, uncertainty level, and signals most relevant to your bid."
              : "Extracting text from your document…"}
          </p>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex gap-3">
          <span className="text-red-500 text-lg shrink-0">✕</span>
          <div className="flex flex-col gap-1">
            <p className="text-red-800 font-semibold text-sm">Could not read document</p>
            <p className="text-red-600 text-sm">{errorMsg}</p>
            <button onClick={() => { setUploadState("idle"); setErrorMsg(""); }} className="text-cap-blue text-sm font-medium hover:underline w-fit mt-1">
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Analysis results */}
      {isDone && analysis && (
        <div className="flex flex-col gap-4">
          {/* File + confidence badge */}
          <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 shadow-card">
            <div className="w-9 h-9 rounded-lg bg-cap-light flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-cap-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-cap-navy font-semibold text-sm truncate">{fileName}</p>
              <p className="text-cap-muted text-xs">AI analysis complete</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${confidenceColour(analysis.interpretation.confidence)}`}>
              {analysis.interpretation.confidence === "high" ? "High confidence" :
               analysis.interpretation.confidence === "medium" ? "Medium confidence" :
               "Low — answer questions carefully"}
            </span>
          </div>

          {/* AI interpretation panel */}
          <div className="bg-cap-navy rounded-xl p-5 flex flex-col gap-3">
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest">AI Interpretation</p>
            <p className="text-white text-sm leading-relaxed">
              <span className="font-semibold text-blue-200">Decision type: </span>
              {analysis.interpretation.decisionType}
            </p>
            <p className="text-white text-sm leading-relaxed">
              <span className="font-semibold text-blue-200">Main uncertainty: </span>
              {analysis.interpretation.uncertainty}
            </p>
            {analysis.interpretation.assumptions.length > 0 && (
              <div className="border-t border-white/10 pt-3">
                <p className="text-blue-300 text-xs font-semibold mb-1.5">Assumptions made:</p>
                <ul className="flex flex-col gap-1">
                  {analysis.interpretation.assumptions.map((a, i) => (
                    <li key={i} className="text-blue-100 text-xs flex gap-2"><span className="text-blue-400 shrink-0">•</span>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Signal summaries grid */}
          {analysis.interpretation.signalSummaries.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-cap-navy font-semibold text-sm">Signals extracted from your document</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {analysis.interpretation.signalSummaries.map((s, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-cap-navy font-semibold text-xs">{s.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        s.value === "high" ? "bg-cap-light text-cap-blue" :
                        s.value === "low" ? "bg-gray-100 text-cap-muted" :
                        "bg-amber-50 text-amber-700"}`}>{s.value}</span>
                    </div>
                    <p className="text-cap-muted text-xs leading-relaxed">{s.plain}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-200">
        <button
          onClick={onSkip}
          className="flex-1 rounded border border-gray-300 px-5 py-3 font-medium text-cap-muted text-sm hover:border-cap-blue hover:text-cap-blue transition-colors"
        >
          Skip — proceed without document
        </button>
        {isDone && (
          <button
            onClick={() => onComplete("", fileName, analysis!)}
            className="flex-1 rounded bg-cap-blue text-white px-5 py-3 font-semibold text-sm hover:bg-cap-navy transition-colors shadow-card inline-flex items-center justify-center gap-2"
          >
            Continue to questions
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
