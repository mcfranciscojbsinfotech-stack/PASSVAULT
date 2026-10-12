'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, AlertTriangle, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

export default function RecoverAccountPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-200">
        <div className="text-center mb-6">
          <div className="mx-auto h-12 w-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-3">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Account Recovery</h1>
          <p className="text-xs text-slate-500 mt-1">
            Reset account credentials and review cryptographic recovery architecture
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong className="text-slate-900">Zero-Knowledge Architecture Note:</strong>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Your account authentication password and your 25-character Vault Recovery Code are
                strictly separate cryptographic secrets. Resetting your login password will restore
                account access, but decrypting your vault requires your 25-character recovery code.
              </p>
            </div>
          </div>
        </div>

        {submitted ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center space-y-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
            <p>
              If an account with <strong>{email}</strong> exists, password reset instructions have
              been dispatched.
            </p>
            <Link
              href="/login"
              className="inline-block mt-2 text-xs font-semibold text-cyber-700 underline"
            >
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alice@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-cyber-600 hover:bg-cyber-700 text-white text-xs font-semibold shadow-md shadow-cyber-600/20 transition-all"
            >
              Send Password Reset Link
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
