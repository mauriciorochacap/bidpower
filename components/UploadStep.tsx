"use client";

import { useState, useRef, useCallback } from "react";
import { extractTextFromFile, SUPPORTED_TYPES, SUPPORTED_LABEL } from "@/lib/documentParser";
import { analyseBidDocument } from "@/lib/bidSignals";
import type { BidSignals } from "@/lib/bidSignals";

interface UploadStepProps {
  onComplete: (text: string, fileName: string, signals: BidSignals) => void;
  onSkip: () => void;
}

type UploadState = "idle" | "dragging" | "parsing" | "done" | "error";

export default function UploadStep({ onComplete, onSkip }: UploadStepProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState("");
  const [signals, setSignals] = useState<BidSignals | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setUploadState("parsing");
    setErrorMsg("");
    try {
      const text = await extractTextFromFile(file);
      const bidSignals = analyseBidDocument(text);
      setSignals(bidSignals);
      setUploadState("done");
      // Auto-proceed after a beat so the user sees the analysis
      setTimeout(() => onComplete(text, file.name, bidSignals), 0);
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
  const isParsing = uploadState === "parsing";
  const isDone = uploadState === "done";
  const isError = uploadState === "error";

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
          We&apos;ll analyse your bid document alongside your answers to give a sharper, more contextual recommendation.
          Supports {SUPPORTED_LABEL} files.
        </p>
      </div>

      {/* Upload zone */}
      {!isDone && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isParsing && inputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200
            ${isDragging ? "border-cap-blue bg-cap-light scale-[1.01]" : "border-gray-300 bg-white hover:border-cap-blue hover:bg-cap-light"}
            ${isParsing ? "cursor-wait opacity-80" : ""}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept={SUPPORTED_TYPES}
            onChange={handleFileChange}
            className="hidden"
          />

          {isParsing ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border-4 border-cap-blue border-t-transparent animate-spin" />
              <p className="text-cap-navy font-semibold text-sm">Reading {fileName}…</p>
              <p className="text-cap-muted text-xs">Extracting text and analysing bid signals</p>
            </div>
          ) : (
            <>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isDragging ? "bg-cap-blue" : "bg-cap-light"}`}>
                <svg className={`w-6 h-6 transition-colors ${isDragging ? "text-white" : "text-cap-blue"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-cap-navy font-semibold text-sm">
                  {isDragging ? "Drop to upload" : "Drag & drop your bid document here"}
                </p>
                <p className="text-cap-muted text-xs mt-1">or click to browse — PDF, DOCX, TXT</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex gap-3">
          <span className="text-red-500 text-lg shrink-0">✕</span>
          <div className="flex flex-col gap-1">
            <p className="text-red-800 font-semibold text-sm">Could not read document</p>
            <p className="text-red-600 text-sm">{errorMsg}</p>
            <button
              onClick={() => { setUploadState("idle"); setErrorMsg(""); }}
              className="text-cap-blue text-sm font-medium hover:underline w-fit mt-1"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Analysis results */}
      {isDone && signals && (
        <div className="flex flex-col gap-4">
          {/* File badge */}
          <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 shadow-card">
            <div className="w-9 h-9 rounded-lg bg-cap-light flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-cap-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-cap-navy font-semibold text-sm truncate">{fileName}</p>
              <p className="text-cap-muted text-xs">{signals.wordCount.toLocaleString()} words analysed</p>
            </div>
            <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-semibold">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              Analysed
            </div>
          </div>

          {/* AI Summary */}
          <div className="bg-cap-navy rounded-xl p-5 flex flex-col gap-2">
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest">Document Intelligence</p>
            <p className="text-white text-sm leading-relaxed">{signals.summary}</p>
          </div>

          {/* Detected themes */}
          {signals.detectedThemes.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-cap-navy font-semibold text-sm">Signals detected in your document</p>
              <div className="flex flex-col gap-2">
                {signals.detectedThemes.map((theme, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-4 shadow-card">
                    <span className="text-xl shrink-0">{theme.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-cap-navy font-semibold text-sm">{theme.label}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          theme.strength === "strong"
                            ? "bg-cap-light text-cap-blue"
                            : "bg-gray-100 text-cap-muted"
                        }`}>
                          {theme.strength === "strong" ? "Strong signal" : "Moderate signal"}
                        </span>
                      </div>
                      <p className="text-cap-muted text-xs mt-0.5 leading-relaxed">{theme.description}</p>
                    </div>
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
        {isDone && signals && (
          <button
            onClick={() => onComplete("", fileName, signals)}
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
