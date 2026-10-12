'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { ShieldCheck, AlertTriangle, ArrowRight, Key } from 'lucide-react';

export default function VerifyMfaPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [code, setCode] = useState('');
  const [isBackup, setIsBackup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempToken, setTempToken] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('mfa_temp_token');
    if (!token) {
      router.push('/login');
    } else {
      setTempToken(token);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempToken || !code.trim()) return;

    setLoading(true);
    setError('');

    try {
      await apiRequest('/auth/verify-mfa', {
        method: 'POST',
        body: JSON.stringify({
          tempToken,
          code: code.trim(),
          isBackupCode: isBackup,
        }),
      });

      sessionStorage.removeItem('mfa_temp_token');
      sessionStorage.removeItem('mfa_email');
      await refreshUser();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'MFA verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-200 text-center">
        <div className="mx-auto h-12 w-12 rounded-xl bg-cyber-50 border border-cyber-100 flex items-center justify-center text-cyber-600 mb-4">
          <ShieldCheck className="h-6 w-6" />
        </div>

        <h1 className="text-xl font-bold text-slate-900">Two-Factor Authentication</h1>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          {isBackup
            ? 'Enter one of your 8-digit emergency backup recovery codes'
            : 'Enter the 6-digit verification code from your authenticator application'}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 text-left">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={isBackup ? 'XXXX-XXXX' : '000000'}
              className="w-full px-3.5 py-3 rounded-lg border border-slate-300 text-sm text-center font-mono tracking-widest focus:ring-2 focus:ring-cyber-500 focus:outline-none"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-cyber-600 hover:bg-cyber-700 text-white text-xs font-semibold shadow-md shadow-cyber-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Verifying...' : 'Authenticate'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              setIsBackup(!isBackup);
              setCode('');
              setError('');
            }}
            className="text-xs font-medium text-cyber-600 hover:underline inline-flex items-center gap-1.5"
          >
            <Key className="h-3.5 w-3.5" />
            <span>{isBackup ? 'Use Authenticator App Instead' : 'Use a Backup Recovery Code'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
