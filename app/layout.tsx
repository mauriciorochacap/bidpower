import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "BidPower — Artefact Recommender",
  description: "Decide the right storytelling artefact for your consultancy bid.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cap-bg font-sans">
        <AppProvider>
          {/* Top navigation bar */}
          <div className="bg-cap-navy">
            <div className="mx-auto max-w-6xl px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-cap-blue flex items-center justify-center">
                    <span className="text-white font-bold text-xs">BP</span>
                  </div>
                  <span className="text-white font-semibold text-sm tracking-wide">BidPower</span>
                </div>
                <span className="hidden sm:block text-blue-400 text-xs">|</span>
                <span className="hidden sm:block text-blue-300 text-xs font-medium tracking-widest uppercase">Artefact Recommender</span>
              </div>
              <span className="text-blue-300 text-xs hidden sm:block">Powered by Capgemini Invent</span>
            </div>
          </div>

          {/* Page content */}
          <main className="mx-auto max-w-4xl px-6 py-10 sm:py-16">{children}</main>

          {/* Footer */}
          <footer className="border-t border-gray-200 bg-white mt-20">
            <div className="mx-auto max-w-6xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-cap-blue flex items-center justify-center">
                  <span className="text-white font-bold text-[9px]">BP</span>
                </div>
                <span className="text-cap-navy font-semibold text-sm">BidPower</span>
              </div>
              <p className="text-cap-muted text-xs">© 2026 Capgemini. Internal tool — not for distribution.</p>
            </div>
          </footer>
        </AppProvider>
      </body>
    </html>
  );
}
