"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      window.location.href = "/admin";
    }, 800);
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4" style={{ marginLeft: 0 }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded bg-teal flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="text-white">
                <rect x="0" y="0" width="5" height="5" fill="currentColor" opacity="0.7" />
                <rect x="7" y="0" width="5" height="5" fill="currentColor" />
                <rect x="0" y="7" width="5" height="5" fill="currentColor" />
                <rect x="7" y="7" width="5" height="5" fill="currentColor" opacity="0.4" />
              </svg>
            </div>
            <span className="font-semibold text-sm text-ink">ProofSignal Labs</span>
          </Link>
          <p className="font-mono text-xs text-ink-faint mt-1">Admin Access</p>
        </div>

        {/* Card */}
        <div className="card p-6">
          <h1 className="text-lg font-semibold text-ink mb-1">Sign in</h1>
          <p className="text-sm text-ink-muted mb-6">Access the operator dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="admin@proofsignallabs.com"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••••"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="font-mono text-xs text-ink-faint hover:text-ink transition-colors">
            ← Back to proofsignallabs.com
          </Link>
        </div>
      </div>
    </div>
  );
}
