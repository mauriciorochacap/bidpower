/**
 * documentParser.ts
 *
 * Extracts plain text from uploaded bid documents.
 * Supports: PDF, DOCX, TXT, MD
 */

// ── PDF extraction via pdfjs-dist v3 (webpack-safe) ───────────────────────
async function extractFromPdf(file: File): Promise<string> {
  // Use the legacy CJS build — avoids "Object.defineProperty on non-object"
  // errors that occur with pdfjs v4/v5 ESM builds under Next.js webpack.
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js" as string);

  // Point worker at the matching CDN file so webpack never tries to bundle it
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = (content.items as Array<{ str?: string }>)
      .map((item) => item.str ?? "")
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n");
}

// ── DOCX extraction via mammoth (browser-safe) ────────────────────────────
async function extractFromDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

// ── Plain text ─────────────────────────────────────────────────────────────
function extractFromText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) ?? "");
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// ── Main export ────────────────────────────────────────────────────────────
export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "pdf") return extractFromPdf(file);
  if (ext === "docx") return extractFromDocx(file);
  if (["txt", "md"].includes(ext)) return extractFromText(file);

  throw new Error(`Unsupported file type: .${ext}. Please upload a PDF, DOCX, or TXT file.`);
}

export const SUPPORTED_TYPES = ".pdf,.docx,.txt,.md";
export const SUPPORTED_LABEL = "PDF, DOCX, or TXT";
