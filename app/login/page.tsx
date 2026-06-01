"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.replace("/");
    } else {
      setError(true);
      setPassword("");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-card border border-gray-200 p-10 w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-cap-blue animate-pulse"></span>
            <span className="text-cap-blue text-xs font-semibold uppercase tracking-widest">Bid Intelligence Tool</span>
          </div>
          <h1 className="text-2xl font-extrabold text-cap-navy">Access required</h1>
          <p className="text-cap-muted text-sm">Enter the password to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            required
            className="border border-gray-300 rounded px-4 py-2.5 text-sm text-cap-navy focus:outline-none focus:ring-2 focus:ring-cap-blue"
          />
          {error && (
            <p className="text-red-500 text-sm">Incorrect password. Try again.</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-cap-blue hover:bg-cap-navy text-white font-semibold px-6 py-3 rounded transition-colors duration-200 text-sm disabled:opacity-60"
          >
            {loading ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
