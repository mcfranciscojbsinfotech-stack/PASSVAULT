'use client';

import React, { useState, useEffect } from 'react';
import { SyncService, SyncResult } from '@/lib/sync-service';
import { useVault } from '@/lib/vault-context';
import { apiRequest } from '@/lib/api-client';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

export default function SynchronizationPage() {
  const { credentials, isolatedCredentials, refreshVault } = useVault();
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [autoSync, setAutoSync] = useState(false);

  const fetchStatus = async () => {
    try {
      const data = await apiRequest('/sync/status');
      setServerStatus(data);
    } catch (err) {
      console.error('Failed to query sync status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await SyncService.performSync();
      setLastResult(result);
      await refreshVault();
      await fetchStatus();
    } catch (err: any) {
      setLastResult({
        success: false,
        pushedCount: 0,
        pulledCount: 0,
        conflicts: [],
        error: err.message || 'Sync failed',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Selective Cloud Synchronization</h1>
          <p className="text-xs text-slate-500 mt-1">
            Zero-knowledge synchronization pipeline for eligible non-isolated credentials
          </p>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-600 hover:bg-cyber-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-cyber-600/20 transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Synchronizing Vault...' : 'Sync Now'}</span>
        </button>
      </div>

      {/* Architectural Guarantee Notice */}
      <div className="p-4 rounded-2xl bg-cyber-50/60 border border-cyber-100 flex items-start gap-3.5">
        <ShieldCheck className="h-5 w-5 text-cyber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-cyber-900 space-y-1">
          <strong className="block">Strict Architectural Isolation Guarantee:</strong>
          <p className="text-cyber-800 leading-relaxed">
            Only non-isolated credentials from the Synchronized repository are included in sync
            requests. The sync engine possesses zero references to the separate Isolated Database,
            ensuring local-only records never travel across the network.
          </p>
        </div>
      </div>

      {/* Sync Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <RefreshCw className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Synced Records</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{credentials.length}</div>
          <p className="text-[10px] text-slate-400 mt-1">Eligible for cloud sync</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-sm ring-1 ring-emerald-500/10">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <ShieldAlert className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Excluded Records</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-900">
            {isolatedCredentials.length}
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">Strictly isolated local only</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Last Server Sync</span>
          </div>
          <div className="text-xs font-semibold text-slate-800 mt-2">
            {serverStatus?.lastSyncedAt
              ? new Date(serverStatus.lastSyncedAt).toLocaleString()
              : 'Never Synced'}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Cloud timestamp</p>
        </div>
      </div>

      {/* Sync Execution Output */}
      {lastResult && (
        <div
          className={`p-6 rounded-2xl border shadow-sm space-y-3 ${
            lastResult.success ? 'bg-white border-emerald-200' : 'bg-rose-50 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {lastResult.success ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            )}
            <h3 className="text-sm font-bold text-slate-900">
              {lastResult.success ? 'Synchronization Completed Successfully' : 'Synchronization Error'}
            </h3>
          </div>

          {lastResult.success ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-600">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-cyber-600" />
                <span>Pushed: <strong>{lastResult.pushedCount}</strong> items</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                <span>Pulled: <strong>{lastResult.pulledCount}</strong> items</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-500" />
                <span>Conflicts: <strong>{lastResult.conflicts.length}</strong></span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-rose-700">{lastResult.error}</p>
          )}

          <div className="text-[10px] text-slate-400 pt-1">
            Completed at {new Date(lastResult.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Auto-Sync Toggle Control */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Automatic Background Sync</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronize non-isolated items automatically upon saving or editing
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={autoSync}
            onChange={(e) => setAutoSync(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyber-600"></div>
        </label>
      </div>
    </div>
  );
}
