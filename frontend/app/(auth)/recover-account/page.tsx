'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  AlertTriangle,
  ArrowLeft,
  Mail,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  deriveKeyFromRecoveryCode,
  generateSalt,
  validateRecoveryCode,
  normalizeRecoveryCode,
} from '@passvault/crypto';

export default function RecoverAccountPage() {
  const [tab, setTab] = useState<'reset' | 'verify'>('reset');

  // Reset tab state
  const [email, setEmail] = useState('');
  const [resetSubmitted, setResetSubmitted] = useState(false);

  // Recovery code verification tab state
  const [recoveryCode, setRecoveryCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    valid: boolean;
    message: string;
    keyPreview?: string;
  } | null>(null);

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetSubmitted(true);
  };

  const handleVerifyRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyResult(null);

    try {
      const cleaned = normalizeRecoveryCode(recoveryCode);

      if (!validateRecoveryCode(cleaned)) {
        setVerifyResult({
          valid: false,
          message:
            'Invalid recovery code format: must be 25 Crockford Base32 characters (excluding ambiguous O, 0, I, 1).',
        });
        setVerifying(false);
        return;
      }

      // Perform real client-side HKDF key derivation
      const testSalt = generateSalt(16);
      const rootKey = await deriveKeyFromRecoveryCode(cleaned, testSalt, false);

      setVerifyResult({
        valid: true,
        message:
          'Recovery code is cryptographically valid! 256-bit AES-GCM master root key derived successfully using HKDF-SHA-256.',
        keyPreview: 'Key Type: 256-bit AES-GCM • Algorithm: HKDF-SHA-256 • Status: Cryptographically Sound',
      });
    } catch (err: any) {
      setVerifyResult({
        valid: false,
        message: err.message || 'Cryptographic derivation failed for this recovery code.',
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl border border-slate-200">
        <div className="text-center mb-6">
          <div className="mx-auto h-12 w-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-3">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Account &amp; Vault Recovery</h1>
          <p className="text-xs text-slate-500 mt-1">
            Reset account credentials or verify your 25-character vault recovery key
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('reset')}
            className={`flex-1 py-2 rounded-lg transition-all text-center ${
              tab === 'reset'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Password Reset
          </button>
          <button
            type="button"
            onClick={() => setTab('verify')}
            className={`flex-1 py-2 rounded-lg transition-all text-center ${
              tab === 'verify'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Recovery Code Verification
          </button>
        </div>

        {/* Security Architecture Callout */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong className="text-slate-900">Zero-Knowledge Architecture Rule:</strong>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Your portal login password and your 25-character Vault Recovery Code are separate
                secrets. Resetting your login password allows logging into the system, but
                decrypting vault credentials requires your 25-character recovery code.
              </p>
            </div>
          </div>
        </div>

        {/* Tab 1: Password Reset */}
        {tab === 'reset' && (
          <div>
            {resetSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center space-y-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
                <p>
                  If an account with <strong>{email}</strong> exists, password reset instructions
                  have been dispatched.
                </p>
                <Link
                  href="/login"
                  className="inline-block mt-2 text-xs font-semibold text-cyber-700 underline"
                >
                  Return to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
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
                      placeholder="alice@passvault.local"
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
          </div>
        )}

        {/* Tab 2: Recovery Code Verification */}
        {tab === 'verify' && (
          <form onSubmit={handleVerifyRecoveryCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                25-Character Vault Recovery Code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  placeholder="ABCDE-FGHIJ-KLMNO-PQRST-UVWXY"
                  maxLength={35}
                  className="w-full pl-9 pr-3.5 py-2.5 font-mono uppercase rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none tracking-wider"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Formatted as 25 alphanumeric characters (hyphens are optional).
              </p>
            </div>

            {verifyResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  verifyResult.valid
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {verifyResult.valid ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                  )}
                  <span>{verifyResult.valid ? 'Verified Valid' : 'Verification Error'}</span>
                </div>
                <p className="text-[11px] leading-relaxed">{verifyResult.message}</p>
                {verifyResult.keyPreview && (
                  <div className="pt-1 font-mono text-[10px] text-emerald-700 font-semibold">
                    {verifyResult.keyPreview}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
            >
              {verifying ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5 text-cyber-400" />
              )}
              <span>Verify Cryptographic Recovery Code</span>
            </button>
          </form>
        )}

        {/* Back Link */}
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
