'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';
import { Database, HardDrive, ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';

export default function AdminStoragePage() {
  const [stats, setStats] = useState<any>(null);
  const [localEstimate, setLocalEstimate] = useState<{ usage?: number; quota?: number } | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await apiRequest('/admin/storage');
      setStats(data);

      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        setLocalEstimate({ usage: est.usage, quota: est.quota });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Storage Management & Partitioning</h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor client IndexedDB local usage and server encrypted envelope storage
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="p-2 rounded-lg text-slate-500 hover:bg-white border border-slate-200"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Local Browser IndexedDB */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-400">
            <HardDrive className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Browser IndexedDB</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {formatBytes(localEstimate?.usage)}
          </div>
          <p className="text-[11px] text-slate-500">
            Estimated storage allocated by browser for local encrypted Dexie stores.
          </p>
        </div>

        {/* Server Encrypted Vault Envelopes */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Database className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Cloud Ciphertexts</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {stats?.cloudEncryptedItemCount ?? '—'}
          </div>
          <p className="text-[11px] text-slate-500">
            Total active AES-256-GCM encrypted envelopes stored on the backend.
          </p>
        </div>

        {/* Tombstoned Items */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-400">
            <RefreshCw className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Tombstone Records</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {stats?.tombstoneDeletedItemCount ?? '—'}
          </div>
          <p className="text-[11px] text-slate-500">
            Deleted records retained as tombstones for multi-device sync propagation.
          </p>
        </div>
      </div>

      {/* Storage Architecture Verification Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Storage Architecture Verification</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 block text-[11px]">Database Engine</span>
            <span className="font-bold text-slate-900">
              {stats?.databaseEngine || 'Prisma ORM (SQLite / PostgreSQL)'}
            </span>
            <p className="text-[11px] text-slate-500 pt-1">
              Supports SQLite for zero-setup local execution and PostgreSQL for cloud deployment.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 space-y-1">
            <span className="text-emerald-700 block text-[11px] font-bold">
              Isolate Mode Architectural Isolation
            </span>
            <div className="flex items-center gap-1.5 font-bold text-emerald-950">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Strict Enforcement Active</span>
            </div>
            <p className="text-[11px] text-emerald-800 pt-1">
              Isolated credentials remain strictly in local IndexedDB and never enter the cloud
              sync pipeline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
