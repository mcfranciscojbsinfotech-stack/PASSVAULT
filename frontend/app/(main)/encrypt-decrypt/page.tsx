'use client';

import React, { useState } from 'react';
import {
  encryptPayloadToEnvelope,
  decryptPayloadFromEnvelope,
  serializeEnvelope,
} from '@passvault/crypto';
import { useVault } from '@/lib/vault-context';
import { Binary, Lock, Unlock, Copy, Check, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { EncryptedEnvelope } from '@passvault/shared';

export default function EncryptDecryptPage() {
  const { recoveryCode } = useVault();
  const [activeTab, setActiveTab] = useState<'encrypt' | 'decrypt'>('encrypt');

  // Encryption state
  const [plainInput, setPlainInput] = useState('');
  const [encryptSecret, setEncryptSecret] = useState(recoveryCode || '');
  const [derivedEnvelope, setDerivedEnvelope] = useState<EncryptedEnvelope | null>(null);
  const [encryptError, setEncryptError] = useState('');
  const [copiedCipher, setCopiedCipher] = useState(false);

  // Decryption state
  const [envelopeInput, setEnvelopeInput] = useState('');
  const [decryptSecret, setDecryptSecret] = useState(recoveryCode || '');
  const [decryptedText, setDecryptedText] = useState('');
  const [decryptError, setDecryptError] = useState('');
  const [copiedPlain, setCopiedPlain] = useState(false);

  const handleEncrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    setEncryptError('');
    setDerivedEnvelope(null);

    if (!plainInput.trim() || !encryptSecret.trim()) {
      setEncryptError('Plaintext content and secret key are both required.');
      return;
    }

    try {
      const isRecoveryCode = encryptSecret.replace(/[\s-]/g, '').length === 25;
      const envelope = await encryptPayloadToEnvelope(plainInput, encryptSecret, {
        keyDerivation: isRecoveryCode ? 'HKDF-SHA-256' : 'PBKDF2-SHA-256',
      });
      setDerivedEnvelope(envelope);
    } catch (err: any) {
      setEncryptError(err.message || 'Encryption failed.');
    }
  };

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    setDecryptError('');
    setDecryptedText('');

    if (!envelopeInput.trim() || !decryptSecret.trim()) {
      setDecryptError('Encrypted JSON envelope and secret key are required.');
      return;
    }

    try {
      const parsedEnvelope: EncryptedEnvelope = JSON.parse(envelopeInput.trim());
      const result = await decryptPayloadFromEnvelope<string>(parsedEnvelope, decryptSecret.trim());
      setDecryptedText(result);
    } catch (err: any) {
      setDecryptError(
        'Decryption failed: authentication tag mismatch, incorrect key, or tampered ciphertext.'
      );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Two-Way Encrypt / Decrypt Tool</h1>
        <p className="text-xs text-slate-500 mt-1">
          Perform standalone client-side AES-256-GCM authenticated encryption and decryption
        </p>
      </div>

      {/* Mode selection tabs */}
      <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold max-w-xs">
        <button
          onClick={() => setActiveTab('encrypt')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === 'encrypt'
              ? 'bg-white text-cyber-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>Encrypt Text</span>
        </button>
        <button
          onClick={() => setActiveTab('decrypt')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === 'decrypt'
              ? 'bg-white text-cyber-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Unlock className="h-4 w-4" />
          <span>Decrypt Envelope</span>
        </button>
      </div>

      {activeTab === 'encrypt' ? (
        <form onSubmit={handleEncrypt} className="space-y-5">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plaintext Message or Payload
              </label>
              <textarea
                rows={4}
                value={plainInput}
                onChange={(e) => setPlainInput(e.target.value)}
                placeholder="Enter sensitive confidential text to encrypt locally..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none resize-none font-mono"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Secret Key or 25-Character Recovery Code
                </label>
                {recoveryCode && (
                  <button
                    type="button"
                    onClick={() => setEncryptSecret(recoveryCode)}
                    className="text-[11px] font-semibold text-cyber-600 hover:underline"
                  >
                    Use Active Vault Key
                  </button>
                )}
              </div>
              <input
                type="text"
                value={encryptSecret}
                onChange={(e) => setEncryptSecret(e.target.value)}
                placeholder="Enter recovery code or custom secret passphrase"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-mono tracking-wider focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                required
              />
            </div>

            {encryptError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{encryptError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-cyber-600 hover:bg-cyber-700 text-white text-xs font-semibold shadow-md shadow-cyber-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" />
              <span>Encrypt with AES-256-GCM</span>
            </button>
          </div>

          {derivedEnvelope && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Encrypted Versioned Envelope (Version 1 • 96-Bit Fresh IV)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(serializeEnvelope(derivedEnvelope));
                    setCopiedCipher(true);
                    setTimeout(() => setCopiedCipher(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-50 border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  {copiedCipher ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-slate-500" />
                  )}
                  <span>{copiedCipher ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto whitespace-pre-wrap select-all">
                {JSON.stringify(derivedEnvelope, null, 2)}
              </pre>
            </div>
          )}
        </form>
      ) : (
        /* Decryption Tab */
        <form onSubmit={handleDecrypt} className="space-y-5">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Encrypted Envelope JSON
              </label>
              <textarea
                rows={5}
                value={envelopeInput}
                onChange={(e) => setEnvelopeInput(e.target.value)}
                placeholder='Paste versioned JSON envelope here: {"version":1,"algorithm":"AES-GCM-256","iv":"...","ciphertext":"..."}'
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none resize-none font-mono"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Secret Key or Recovery Code
                </label>
                {recoveryCode && (
                  <button
                    type="button"
                    onClick={() => setDecryptSecret(recoveryCode)}
                    className="text-[11px] font-semibold text-cyber-600 hover:underline"
                  >
                    Use Active Vault Key
                  </button>
                )}
              </div>
              <input
                type="text"
                value={decryptSecret}
                onChange={(e) => setDecryptSecret(e.target.value)}
                placeholder="Enter the secret key used during encryption"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-mono tracking-wider focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                required
              />
            </div>

            {decryptError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{decryptError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-cyber-600 hover:bg-cyber-700 text-white text-xs font-semibold shadow-md shadow-cyber-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Unlock className="h-4 w-4" />
              <span>Decrypt & Verify Authentication Tag</span>
            </button>
          </div>

          {decryptedText && (
            <div className="p-6 rounded-2xl bg-white border border-emerald-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-950">
                    Decryption Successful • Integrity Verified
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(decryptedText);
                    setCopiedPlain(true);
                    setTimeout(() => setCopiedPlain(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {copiedPlain ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-slate-500" />
                  )}
                  <span>{copiedPlain ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 text-slate-900 text-xs font-mono whitespace-pre-wrap select-all">
                {decryptedText}
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
