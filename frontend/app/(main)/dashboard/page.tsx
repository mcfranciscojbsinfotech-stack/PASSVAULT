'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useVault } from '@/lib/vault-context';
import { useAuth } from '@/lib/auth-context';
import { VaultService } from '@/lib/vault-service';
import { CredentialModal } from '@/components/vault/CredentialModal';
import { CredentialCard } from '@/components/vault/CredentialCard';
import { PasswordHealthChecker } from '@/components/vault/PasswordHealthChecker';
import {
  KeyRound,
  ShieldAlert,
  RefreshCw,
  Plus,
  Dices,
  Lock,
  HardDriveDownload,
  ShieldCheck,
} from 'lucide-react';
import { STORAGE_MODES, StorageMode, VaultItemDecrypted } from '@passvault/shared';

export default function DashboardPage() {
  const { user } = useAuth();
  const { isUnlocked, recoveryCode, credentials, isolatedCredentials, refreshVault } = useVault();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<VaultItemDecrypted | null>(null);

  const totalCredentials = credentials.length + isolatedCredentials.length;
  const recentItems = [...credentials, ...isolatedCredentials]
    .sort((a, b) => new Date(b.clientUpdatedAt).getTime() - new Date(a.clientUpdatedAt).getTime())
    .slice(0, 4);

  const handleSave = async (data: any) => {
    if (!recoveryCode) return;
    await VaultService.saveCredential(data, recoveryCode);
    await refreshVault();
  };

  const handleDelete = async (id: string, mode: StorageMode) => {
    await VaultService.deleteCredential(id, mode);
    await refreshVault();
  };

  const handleMigrate = async (id: string, current: StorageMode, target: StorageMode) => {
    if (!recoveryCode) return;
    await VaultService.migrateStorageMode(id, current, target, recoveryCode);
    await refreshVault();
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Security Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Zero-knowledge credential management with isolated local storage partitioning
          </p>
        </div>

        <button
          onClick={() => {
            setEditItem(null);
            setModalOpen(true);
          }}
          disabled={!isUnlocked}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-600 hover:bg-cyber-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-cyber-600/20 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Credential</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Credentials */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Credentials
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {isUnlocked ? totalCredentials : '—'}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-cyber-50 text-cyber-600 flex items-center justify-center">
            <KeyRound className="h-5 w-5" />
          </div>
        </div>

        {/* Isolate Mode (Local Only) */}
        <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-sm flex items-center justify-between ring-1 ring-emerald-500/10">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Isolate Mode (Local)
            </span>
            <div className="text-2xl font-extrabold text-emerald-900 mt-1">
              {isUnlocked ? isolatedCredentials.length : '—'}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        {/* Cloud Synced */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Cloud Synced
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {isUnlocked ? credentials.length : '—'}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <RefreshCw className="h-5 w-5" />
          </div>
        </div>

        {/* Security Health */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Vault Status
            </span>
            <div className="text-base font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isUnlocked ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>{isUnlocked ? 'Unlocked & Active' : 'Locked'}</span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Password Health Checker (Client-Side Zero-Knowledge) */}
      {isUnlocked && totalCredentials > 0 && (
        <PasswordHealthChecker
          credentials={credentials}
          isolatedCredentials={isolatedCredentials}
          onEditCredential={(target) => {
            setEditItem(target);
            setModalOpen(true);
          }}
        />
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/isolate"
          className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200 hover:border-emerald-300 transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-emerald-950">Isolate Mode Repository</h3>
          </div>
          <p className="text-xs text-emerald-800">
            View strictly offline, local-only partitioned credentials excluded from cloud sync.
          </p>
        </Link>

        <Link
          href="/generator"
          className="p-4 rounded-xl bg-gradient-to-br from-cyber-50 to-blue-50/50 border border-cyber-200 hover:border-cyber-300 transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <Dices className="h-5 w-5 text-cyber-600" />
            <h3 className="text-sm font-bold text-cyber-950">Password Generator</h3>
          </div>
          <p className="text-xs text-cyber-800">
            Generate cryptographically secure passwords with entropy and crack-time metrics.
          </p>
        </Link>

        <Link
          href="/backups"
          className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-200 hover:border-slate-300 transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <HardDriveDownload className="h-5 w-5 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Encrypted Backups</h3>
          </div>
          <p className="text-xs text-slate-600">
            Create password-protected JSON and ZIP exports or restore previously saved vaults.
          </p>
        </Link>
      </div>

      {/* Recent Credentials Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Recently Updated Credentials</h2>
          <Link href="/vault" className="text-xs font-semibold text-cyber-600 hover:underline">
            View All ({totalCredentials})
          </Link>
        </div>

        {recentItems.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-dashed border-slate-300">
            <KeyRound className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No credentials saved yet</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Click &quot;New Credential&quot; to securely encrypt and store your first password.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentItems.map((item) => (
              <CredentialCard
                key={item.id}
                item={item}
                onEdit={(target) => {
                  setEditItem(target);
                  setModalOpen(true);
                }}
                onDelete={handleDelete}
                onMigrateMode={handleMigrate}
              />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <CredentialModal
          initialData={editItem}
          defaultMode={STORAGE_MODES.SYNCHRONIZED}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false);
            setEditItem(null);
          }}
        />
      )}
    </div>
  );
}
