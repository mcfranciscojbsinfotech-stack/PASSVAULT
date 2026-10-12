'use client';

import React, { useState } from 'react';
import { useVault } from '@/lib/vault-context';
import { VaultService } from '@/lib/vault-service';
import { BackupService } from '@/lib/backup-service';
import { CredentialCard } from '@/components/vault/CredentialCard';
import { CredentialModal } from '@/components/vault/CredentialModal';
import {
  ShieldAlert,
  Plus,
  Search,
  HardDriveDownload,
  CheckCircle2,
  AlertTriangle,
  Lock,
  KeyRound,
} from 'lucide-react';
import { STORAGE_MODES, StorageMode, VaultItemDecrypted } from '@passvault/shared';

export default function IsolatePage() {
  const { isUnlocked, recoveryCode, isolatedCredentials, refreshVault, openUnlockModal } = useVault();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<VaultItemDecrypted | null>(null);
  const [backupPassword, setBackupPassword] = useState('');
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);

  const filteredItems = isolatedCredentials.filter((i) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      i.title.toLowerCase().includes(q) ||
      i.username?.toLowerCase().includes(q) ||
      i.url?.toLowerCase().includes(q)
    );
  });

  const handleSave = async (data: any) => {
    if (!recoveryCode) return;
    await VaultService.saveCredential({ ...data, storageMode: STORAGE_MODES.ISOLATED }, recoveryCode);
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

  const handleExportIsolated = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupPassword) return;
    setExporting(true);

    try {
      const blob = await BackupService.exportEncryptedZipBackup(backupPassword);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `passvault-isolated-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupSuccess(true);
      setTimeout(() => {
        setBackupSuccess(false);
        setBackupModalOpen(false);
        setBackupPassword('');
      }, 2500);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Prominent Architectural Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-6 sm:p-8 shadow-lg border border-emerald-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-1 border border-emerald-400/30">
                LOCAL ONLY — NOT SYNCED
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Isolate Mode Partition
              </h1>
              <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
                Credentials in this repository are saved exclusively in a separate local IndexedDB
                database. They are strictly excluded from online synchronization and cloud APIs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBackupModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur border border-white/20 transition-all"
            >
              <HardDriveDownload className="h-4 w-4" />
              <span>Export Local / USB</span>
            </button>

            <button
              onClick={() => {
                if (!isUnlocked) {
                  openUnlockModal();
                  return;
                }
                setEditItem(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Isolated Credential</span>
            </button>
          </div>
        </div>
      </div>

      {/* Vault Locked Banner */}
      {!isUnlocked && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <KeyRound className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-950">Vault is Locked</h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Unlock your vault with your 25-character recovery code to view and manage isolated credentials.
              </p>
            </div>
          </div>
          <button
            onClick={openUnlockModal}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-md transition-all shrink-0 flex items-center justify-center gap-2"
          >
            <KeyRound className="h-4 w-4" />
            <span>Unlock Vault</span>
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search isolated credentials..."
            className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          {isolatedCredentials.length} Isolated Items
        </span>
      </div>

      {/* Grid of Isolated Items */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-slate-300">
          <ShieldAlert className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No isolated credentials found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search.trim()
              ? 'No matching isolated records.'
              : 'Add critical keys, server root passwords, or recovery codes here to guarantee they never touch the cloud.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
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

      {/* Modal for adding/editing */}
      {modalOpen && (
        <CredentialModal
          initialData={editItem}
          defaultMode={STORAGE_MODES.ISOLATED}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false);
            setEditItem(null);
          }}
        />
      )}

      {/* Local / USB Export Modal */}
      {backupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <HardDriveDownload className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Local / USB Backup</h3>
                <p className="text-xs text-slate-500">
                  Export AES-256-GCM encrypted archive for physical storage
                </p>
              </div>
            </div>

            {backupSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center space-y-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
                <p className="font-bold">Encrypted archive downloaded successfully!</p>
                <p className="text-[11px] text-emerald-700">
                  Store on your USB flash drive or offline storage.
                </p>
              </div>
            ) : (
              <form onSubmit={handleExportIsolated} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Set Backup Password
                  </label>
                  <input
                    type="password"
                    value={backupPassword}
                    onChange={(e) => setBackupPassword(e.target.value)}
                    placeholder="Enter a strong password to protect the file"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Uses PBKDF2-SHA-256 (600,000 rounds) key derivation. Kept separate from your
                    vault recovery code.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    Web browsers cannot directly communicate with raw USB device hardware without
                    desktop bridges. This file download allows safe transfer to any removable drive.
                  </span>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setBackupModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={exporting}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {exporting ? 'Creating Archive...' : 'Download Encrypted Archive'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
