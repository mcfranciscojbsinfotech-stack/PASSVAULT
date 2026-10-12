'use client';

import React, { useState, useEffect } from 'react';
import {
  generatePassword,
  evaluatePasswordStrength,
  generateVaultRecoveryCode,
} from '@passvault/crypto';
import { Dices, Copy, Check, RefreshCw, KeyRound, ShieldAlert, Sparkles } from 'lucide-react';

export default function GeneratorPage() {
  const [activeTab, setActiveTab] = useState<'password' | 'recoveryCode'>('password');

  // Password state
  const [length, setLength] = useState(20);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [password, setPassword] = useState('');
  const [copiedPwd, setCopiedPwd] = useState(false);

  // Recovery code state
  const [recoveryCode, setRecoveryCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleGeneratePassword = () => {
    try {
      const p = generatePassword({
        length,
        uppercase,
        lowercase,
        numbers,
        symbols,
        excludeAmbiguous,
      });
      setPassword(p);
      setCopiedPwd(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateRecoveryCode = () => {
    const c = generateVaultRecoveryCode();
    setRecoveryCode(c);
    setCopiedCode(false);
  };

  useEffect(() => {
    handleGeneratePassword();
    handleGenerateRecoveryCode();
  }, []);

  const strength = evaluatePasswordStrength(password);

  const handleCopyPassword = () => {
    if (password) {
      navigator.clipboard.writeText(password);
      setCopiedPwd(true);
      setTimeout(() => setCopiedPwd(false), 2000);
    }
  };

  const handleCopyRecoveryCode = () => {
    if (recoveryCode) {
      navigator.clipboard.writeText(recoveryCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Cryptographic Secret Generator</h1>
        <p className="text-xs text-slate-500 mt-1">
          Generate high-entropy passwords and standardized 25-character vault recovery keys
        </p>
      </div>

      {/* Mode selection tabs */}
      <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold max-w-md">
        <button
          onClick={() => setActiveTab('password')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === 'password'
              ? 'bg-white text-cyber-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Dices className="h-4 w-4" />
          <span>Website Password</span>
        </button>
        <button
          onClick={() => setActiveTab('recoveryCode')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === 'recoveryCode'
              ? 'bg-white text-cyber-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <KeyRound className="h-4 w-4" />
          <span>25-Char Recovery Code</span>
        </button>
      </div>

      {activeTab === 'password' ? (
        <div className="space-y-6">
          {/* Generated Result Display Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-mono text-base sm:text-lg font-bold tracking-wider text-slate-900 break-all select-all">
                {password}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyPassword}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
                  title="Copy to clipboard"
                >
                  {copiedPwd ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-500" />
                  )}
                  <span>{copiedPwd ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleGeneratePassword}
                  className="p-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
                  title="Generate new"
                >
                  <RefreshCw className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Strength meter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  Strength:{' '}
                  <span
                    className={`font-bold ${
                      strength.score >= 3
                        ? 'text-emerald-600'
                        : strength.score === 2
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {strength.label}
                  </span>
                </span>
                <span className="text-slate-400 font-mono">{strength.entropyBits} bits entropy</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-2 rounded-full transition-colors ${
                      step <= strength.score
                        ? strength.score >= 3
                          ? 'bg-emerald-500'
                          : strength.score === 2
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                        : 'bg-slate-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Configuration Controls */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-900">Customization Parameters</h3>

            {/* Length slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-700">Password Length</label>
                <span className="text-xs font-mono font-bold text-cyber-700 px-2 py-0.5 rounded bg-cyber-50 border border-cyber-200">
                  {length} characters
                </span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={length}
                onChange={(e) => {
                  setLength(parseInt(e.target.value, 10));
                }}
                className="w-full accent-cyber-600 cursor-pointer"
              />
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={uppercase}
                  onChange={(e) => setUppercase(e.target.checked)}
                  className="rounded text-cyber-600 focus:ring-cyber-500"
                />
                <div>
                  <span className="font-semibold text-slate-800">Uppercase Letters</span>
                  <p className="text-[10px] text-slate-500">A - Z</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={lowercase}
                  onChange={(e) => setLowercase(e.target.checked)}
                  className="rounded text-cyber-600 focus:ring-cyber-500"
                />
                <div>
                  <span className="font-semibold text-slate-800">Lowercase Letters</span>
                  <p className="text-[10px] text-slate-500">a - z</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={numbers}
                  onChange={(e) => setNumbers(e.target.checked)}
                  className="rounded text-cyber-600 focus:ring-cyber-500"
                />
                <div>
                  <span className="font-semibold text-slate-800">Numbers</span>
                  <p className="text-[10px] text-slate-500">0 - 9</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={symbols}
                  onChange={(e) => setSymbols(e.target.checked)}
                  className="rounded text-cyber-600 focus:ring-cyber-500"
                />
                <div>
                  <span className="font-semibold text-slate-800">Special Symbols</span>
                  <p className="text-[10px] text-slate-500">!@#$%^&*()_+-=[]...</p>
                </div>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludeAmbiguous}
                  onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                  className="rounded text-cyber-600 focus:ring-cyber-500"
                />
                <span className="text-slate-700">
                  Exclude ambiguous characters (e.g. 0, O, 1, l, I)
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleGeneratePassword}
              className="w-full py-2.5 px-4 rounded-xl bg-cyber-600 hover:bg-cyber-700 text-white text-xs font-semibold shadow-md shadow-cyber-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>Regenerate Password</span>
            </button>
          </div>
        </div>
      ) : (
        /* Recovery Code Tab */
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="p-4 rounded-xl bg-cyber-50/50 border border-cyber-100 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-cyber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-cyber-900 leading-relaxed">
              <strong>Cryptographic Distinction:</strong> A 25-character vault recovery code is a
              root cryptographic secret derived using HKDF-SHA-256 with per-vault salt. It is used
              to initialize and unlock your encrypted vault, not as a website login password.
            </div>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Standardized Crockford Base32 Recovery Key
            </span>
            <div className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-slate-900 select-all">
              {recoveryCode}
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={handleCopyRecoveryCode}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                {copiedCode ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-500" />
                )}
                <span>{copiedCode ? 'Copied' : 'Copy Recovery Code'}</span>
              </button>

              <button
                onClick={handleGenerateRecoveryCode}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                <RefreshCw className="h-4 w-4 text-slate-500" />
                <span>Generate New</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
