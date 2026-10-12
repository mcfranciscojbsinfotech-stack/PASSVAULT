'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api-client';
import { CheckCircle2, AlertTriangle, ArrowRight, Mail } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        setToken(urlToken);
        handleVerify(urlToken);
      }
    }
  }, []);

  const handleVerify = async (tokenToUse: string) => {
    if (!tokenToUse) return;
    setLoading(true);
    setError('');
    try {
      await apiRequest('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: tokenToUse }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-200 text-center">
        <div className="mx-auto h-12 w-12 rounded-xl bg-cyber-50 border border-cyber-100 flex items-center justify-center text-cyber-600 mb-4">
          <Mail className="h-6 w-6" />
        </div>

        <h1 className="text-xl font-bold text-slate-900">Email Verification</h1>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Enter the verification code sent to your email address to confirm your account
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 text-left">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
              <strong>Your email has been verified successfully!</strong>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-cyber-600 hover:bg-cyber-700 text-white text-xs font-semibold"
            >
              <span>Continue to Vault</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify(token);
            }}
            className="space-y-4"
          >
            <div>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter verification code"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-center font-mono tracking-widest focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-cyber-600 hover:bg-cyber-700 text-white text-xs font-semibold disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
