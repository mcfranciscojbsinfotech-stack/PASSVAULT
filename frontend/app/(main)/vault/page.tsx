'use client';

import React, { useState, useMemo } from 'react';
import { useVault } from '@/lib/vault-context';
import { VaultService } from '@/lib/vault-service';
import { CredentialCard } from '@/components/vault/CredentialCard';
import { CredentialModal } from '@/components/vault/CredentialModal';
import {
  KeyRound,
  Plus,
  Search,
  Filter,
  Star,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { STORAGE_MODES, StorageMode, VaultItemDecrypted } from '@passvault/shared';

export default function VaultPage() {
  const { isUnlocked, recoveryCode, credentials, isolatedCredentials, refreshVault, openUnlockModal } = useVault();
  const [search, setSearch] = useState('');
  const [partitionFilter, setPartitionFilter] = useState<'all' | 'sync' | 'isolated'>('all');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<VaultItemDecrypted | null>(null);

  const filteredItems = useMemo(() => {
    let list: VaultItemDecrypted[] = [];
    if (partitionFilter === 'all') {
      list = [...credentials, ...isolatedCredentials];
    } else if (partitionFilter === 'sync') {
      list = credentials;
    } else {
      list = isolatedCredentials;
    }

    if (favoriteOnly) {
      list = list.filter((i) => i.favorite);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.username?.toLowerCase().includes(q) ||
          i.url?.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => a.title.localeCompare(b.title));
  }, [credentials, isolatedCredentials, partitionFilter, favoriteOnly, search]);

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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Personal Vault</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your client-encrypted credentials with zero-knowledge security
          </p>
        </div>

        <button
          onClick={() => {
            if (!isUnlocked) {
              openUnlockModal();
              return;
            }
            setEditItem(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-600 hover:bg-cyber-700 text-white text-xs font-semibold shadow-md shadow-cyber-600/20 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Credential</span>
        </button>
      </div>

      {/* Vault Locked Banner */}
      {!isUnlocked && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <KeyRound className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-950">Vault is Locked</h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Unlock your vault with your 25-character recovery code or generate a key to manage encrypted credentials.
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

      {/* Search and Filters toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, username, or URL..."
            className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Partition Filter Buttons */}
          <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
            <button
              onClick={() => setPartitionFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                partitionFilter === 'all'
                  ? 'bg-white text-slate-900 font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({credentials.length + isolatedCredentials.length})
            </button>
            <button
              onClick={() => setPartitionFilter('sync')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                partitionFilter === 'sync'
                  ? 'bg-white text-cyber-700 font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <RefreshCw className="h-3 w-3" />
              <span>Synced ({credentials.length})</span>
            </button>
            <button
              onClick={() => setPartitionFilter('isolated')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                partitionFilter === 'isolated'
                  ? 'bg-white text-emerald-700 font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="h-3 w-3" />
              <span>Isolated ({isolatedCredentials.length})</span>
            </button>
          </div>

          {/* Favorite Toggle */}
          <button
            onClick={() => setFavoriteOnly(!favoriteOnly)}
            className={`p-2 rounded-lg border transition-colors ${
              favoriteOnly
                ? 'bg-amber-50 border-amber-300 text-amber-600'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700'
            }`}
            title="Favorites Only"
          >
            <Star className={`h-4 w-4 ${favoriteOnly ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid of Credentials */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-slate-300">
          <KeyRound className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No credentials found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search.trim()
              ? 'No records match your search query. Try clearing the filter.'
              : 'Your vault is currently empty. Add your first credential to get started.'}
          </p>
          {!search.trim() && (
            <button
              onClick={() => {
                if (!isUnlocked) {
                  openUnlockModal();
                  return;
                }
                setEditItem(null);
                setModalOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyber-600 hover:bg-cyber-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Credential</span>
            </button>
          )}
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

      {modalOpen && (
        <CredentialModal
          initialData={editItem}
          defaultMode={
            partitionFilter === 'isolated'
              ? STORAGE_MODES.ISOLATED
              : STORAGE_MODES.SYNCHRONIZED
          }
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
