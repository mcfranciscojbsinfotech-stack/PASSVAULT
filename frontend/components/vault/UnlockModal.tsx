'use client';

import React, { useState } from 'react';
import { useVault } from '@/lib/vault-context';
import {
  generateVaultRecoveryCode,
  validateRecoveryCode,
  formatRecoveryCode,
} from '@passvault/crypto';
import { KeyRound, ShieldAlert, Check, Copy, AlertTriangle } from 'lucide-react';

export function UnlockModal() {
  const { isUnlocked, unlockVault } = useVault();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'unlock' | 'generate'>('unlock');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isUnlocked) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formatted = formatRecoveryCode(code.trim());
    if (!validateRecoveryCode(formatted)) {
      setError('Invalid 25-character recovery code format. Crockford Base32 characters only.');
      return;
    }

    const success = await unlockVault(formatted);
    if (!success) {
      setError('Unable to unlock vault with this code. Please check your recovery key.');
    }
  };

  const handleGenerate = () => {
    const newCode = generateVaultRecoveryCode();
    setGeneratedCode(newCode);
    setAcknowledged(false);
    setCopied(false);
  };

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleConfirmGenerated = async () => {
    if (!generatedCode || !acknowledged) return;
    await unlockVault(generatedCode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-cyber-50 border border-cyber-100 flex items-center justify-center text-cyber-600">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Personal Vault Locked</h2>
            <p className="text-xs text-slate-500">
              End-to-end client encryption requires your 25-character Recovery Code
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-lg bg-slate-100 p-1 mb-5 text-xs font-semibold">
          <button
            onClick={() => {
              setMode('unlock');
              setError('');
            }}
            className={`flex-1 py-1.5 rounded-md transition-all ${
              mode === 'unlock' ? 'bg-white text-cyber-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            Unlock Existing Vault
          </button>
          <button
            onClick={() => {
              setMode('generate');
              setError('');
              if (!generatedCode) handleGenerate();
            }}
            className={`flex-1 py-1.5 rounded-md transition-all ${
              mode === 'generate' ? 'bg-white text-cyber-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            Generate New Key
          </button>
        </div>

        {mode === 'unlock' ? (
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enter 25-Character Vault Recovery Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-cyber-500 focus:border-cyber-500"
                autoComplete="off"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Derived locally with HKDF-SHA-256. Never transmitted to the server.
              </p>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-cyber-600 hover:bg-cyber-700 text-white text-xs font-semibold shadow-md shadow-cyber-600/20 transition-colors"
            >
              Unlock Vault
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Your New 25-Character Recovery Code
              </span>
              <div className="mt-1 text-sm sm:text-base font-mono font-bold tracking-widest text-cyber-900 select-all">
                {generatedCode}
              </div>
              <div className="mt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copied' : 'Copy Key'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="px-3 py-1 rounded-md text-xs font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Regenerate
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                <strong>Zero-Knowledge Security Warning:</strong> PassVault servers never store your
                recovery code. If you lose this key, your encrypted credentials cannot be recovered by
                anyone.
              </span>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="rounded border-slate-300 text-cyber-600 focus:ring-cyber-500"
              />
              <span>I have safely recorded and backed up this recovery code</span>
            </label>

            <button
              type="button"
              disabled={!acknowledged}
              onClick={handleConfirmGenerated}
              className="w-full py-2.5 px-4 rounded-lg bg-cyber-600 hover:bg-cyber-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-cyber-600/20 transition-colors"
            >
              Confirm & Unlock Vault
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
