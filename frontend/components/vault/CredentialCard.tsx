'use client';

import React, { useState } from 'react';
import { VaultItemDecrypted, STORAGE_MODES, StorageMode } from '@passvault/shared';
import {
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  Star,
  ExternalLink,
  Edit2,
  Trash2,
  ShieldAlert,
  RefreshCw,
  ArrowRightLeft,
} from 'lucide-react';

interface CredentialCardProps {
  item: VaultItemDecrypted;
  onEdit: (item: VaultItemDecrypted) => void;
  onDelete: (id: string, mode: StorageMode) => void;
  onMigrateMode: (id: string, currentMode: StorageMode, targetMode: StorageMode) => void;
}

export function CredentialCard({ item, onEdit, onDelete, onMigrateMode }: CredentialCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showMigrateConfirm, setShowMigrateConfirm] = useState(false);

  const isIsolated = item.storageMode === STORAGE_MODES.ISOLATED;
  const targetMode = isIsolated ? STORAGE_MODES.SYNCHRONIZED : STORAGE_MODES.ISOLATED;

  const handleCopyUser = () => {
    if (item.username) {
      navigator.clipboard.writeText(item.username);
      setCopiedUser(true);
      setTimeout(() => setCopiedUser(false), 2000);
    }
  };

  const handleCopyPass = () => {
    navigator.clipboard.writeText(item.password);
    setCopiedPass(true);
    // Best-effort auto-clear clipboard notice after 30 seconds
    setTimeout(() => setCopiedPass(false), 2000);
  };

  return (
    <div className="rounded-xl bg-white border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              isIsolated
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                : 'bg-cyber-50 text-cyber-600 border border-cyber-100'
            }`}
          >
            {isIsolated ? <ShieldAlert className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
              {item.favorite && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
            </div>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-cyber-600 hover:underline mt-0.5 truncate max-w-[200px]"
              >
                <span>{item.url.replace(/^https?:\/\//, '')}</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
        </div>

        {/* Partition Badge */}
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            isIsolated
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-cyber-100 text-cyber-800'
          }`}
        >
          {isIsolated ? 'Local Only • Not Synced' : 'Cloud Synced'}
        </span>
      </div>

      {/* Credentials display fields */}
      <div className="mt-4 space-y-2.5 bg-slate-50/70 p-3 rounded-lg border border-slate-100 text-xs">
        {item.username && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Username:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-800 select-all">{item.username}</span>
              <button
                onClick={handleCopyUser}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
                title="Copy Username"
              >
                {copiedUser ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Password:</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-800 select-all">
              {showPassword ? item.password : '••••••••••••••••'}
            </span>
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 rounded text-slate-400 hover:text-slate-700"
              title={showPassword ? 'Hide Password' : 'Show Password'}
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={handleCopyPass}
              className="p-1 rounded text-slate-400 hover:text-slate-700"
              title="Copy Password"
            >
              {copiedPass ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {item.notes && (
          <div className="pt-1 border-t border-slate-200/60 text-[11px] text-slate-600">
            <span className="font-semibold text-slate-500 block mb-0.5">Notes:</span>
            <p className="whitespace-pre-wrap">{item.notes}</p>
          </div>
        )}
      </div>

      {/* Confirmation for migration across storage partitions */}
      {showMigrateConfirm && (
        <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs">
          <p className="font-bold text-amber-900 mb-1">
            Convert to {isIsolated ? 'Synchronized Mode' : 'Isolate Mode'}?
          </p>
          <p className="text-[11px] text-amber-800 mb-2">
            {isIsolated
              ? 'This credential will be moved into the cloud sync store and encrypted before upload.'
              : 'This credential will be moved to local-only storage. Cloud copies will be tombstoned.'}
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowMigrateConfirm(false)}
              className="px-2.5 py-1 text-slate-600 hover:bg-slate-200/50 rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowMigrateConfirm(false);
                onMigrateMode(item.id, item.storageMode, targetMode);
              }}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium"
            >
              Confirm Migration
            </button>
          </div>
        </div>
      )}

      {/* Confirmation for deletion */}
      {confirmDelete && (
        <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs">
          <p className="font-bold text-rose-900 mb-1">Confirm Deletion</p>
          <p className="text-[11px] text-rose-700 mb-2">
            Are you sure you want to delete this credential?
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2.5 py-1 text-slate-600 hover:bg-slate-200/50 rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setConfirmDelete(false);
                onDelete(item.id, item.storageMode);
              }}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Action footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="text-[11px] text-slate-400">
          Rev {item.revision} • {new Date(item.clientUpdatedAt).toLocaleDateString()}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowMigrateConfirm(true)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-cyber-700"
            title={isIsolated ? 'Convert to Synchronized' : 'Convert to Isolate Mode'}
          >
            <ArrowRightLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
