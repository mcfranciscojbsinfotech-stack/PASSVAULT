'use client';

import React, { useState } from 'react';
import { VaultItemDecrypted, StorageMode, STORAGE_MODES } from '@passvault/shared';
import { generatePassword, evaluatePasswordStrength } from '@passvault/crypto';
import { X, Dices, Eye, EyeOff, ShieldAlert, RefreshCw } from 'lucide-react';

interface CredentialModalProps {
  initialData?: VaultItemDecrypted | null;
  defaultMode?: StorageMode;
  onSave: (data: {
    id?: string;
    title: string;
    url: string;
    username: string;
    password: string;
    notes?: string;
    category?: string;
    favorite?: boolean;
    storageMode: StorageMode;
  }) => Promise<void>;
  onClose: () => void;
}

export function CredentialModal({
  initialData,
  defaultMode = STORAGE_MODES.SYNCHRONIZED,
  onSave,
  onClose,
}: CredentialModalProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [category, setCategory] = useState(initialData?.category || 'General');
  const [favorite, setFavorite] = useState(initialData?.favorite || false);
  const [storageMode, setStorageMode] = useState<StorageMode>(
    initialData?.storageMode || defaultMode
  );
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const passwordStrength = evaluatePasswordStrength(password);

  const handleGenerate = () => {
    const pwd = generatePassword({ length: 20, symbols: true });
    setPassword(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !password) {
      setError('Title and Password are required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave({
        id: initialData?.id,
        title: title.trim(),
        url: url.trim(),
        username: username.trim(),
        password,
        notes: notes.trim(),
        category,
        favorite,
        storageMode,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save credential');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            {initialData ? 'Edit Credential' : 'Add New Credential'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Storage Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Storage Partition Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStorageMode(STORAGE_MODES.SYNCHRONIZED)}
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  storageMode === STORAGE_MODES.SYNCHRONIZED
                    ? 'border-cyber-600 bg-cyber-50/60 text-cyber-900 ring-2 ring-cyber-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <RefreshCw className="h-4 w-4 mt-0.5 text-cyber-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold">Synchronized</div>
                  <div className="text-[10px] text-slate-500">Cloud encrypted & multi-device</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStorageMode(STORAGE_MODES.ISOLATED)}
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  storageMode === STORAGE_MODES.ISOLATED
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <ShieldAlert className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold">Isolate Mode</div>
                  <div className="text-[10px] text-slate-500">Local partition, strictly NOT synced</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. GitHub Account, Personal Email"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Username / Email</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alice@example.com"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Website URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Password with generator & strength indicator */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <button
                type="button"
                onClick={handleGenerate}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyber-600 hover:text-cyber-700"
              >
                <Dices className="h-3.5 w-3.5" />
                <span>Generate Strong Password</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {password && (
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 w-6 rounded-full ${
                          level <= passwordStrength.score
                            ? passwordStrength.score >= 3
                              ? 'bg-emerald-500'
                              : passwordStrength.score === 2
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-medium text-slate-600">{passwordStrength.label}</span>
                </div>
                <span className="text-slate-400">{passwordStrength.entropyBits} bits entropy</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Sensitive Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Private security questions, backup PINs..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none resize-none"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-cyber-600 hover:bg-cyber-700 shadow-sm shadow-cyber-600/20 disabled:opacity-50"
            >
              {saving ? 'Encrypting & Saving...' : 'Save Credential'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
