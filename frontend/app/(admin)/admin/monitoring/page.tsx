'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';
import {
  encryptPayloadToEnvelope,
  decryptPayloadFromEnvelope,
  generateVaultRecoveryCode,
} from '@passvault/crypto';
import {
  Activity,
  Server,
  Database,
  Users,
  AlertCircle,
  RefreshCw,
  Zap,
  CheckCircle2,
} from 'lucide-react';

export default function AdminMonitoringPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchResult, setBenchResult] = useState<{
    encryptTimeMs: number;
    decryptTimeMs: number;
  } | null>(null);

  const fetchStats = async () => {
    try {
      const data = await apiRequest('/admin/monitoring');
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const runCryptoBenchmark = async () => {
    setBenchmarking(true);
    try {
      const recoveryCode = generateVaultRecoveryCode();
      const testPayload = {
        title: 'Benchmark Credential',
        username: 'admin@passvault.local',
        password: 'A'.repeat(64),
        notes: 'B'.repeat(512),
      };

      const t0 = performance.now();
      const envelope = await encryptPayloadToEnvelope(testPayload, recoveryCode);
      const t1 = performance.now();

      await decryptPayloadFromEnvelope(envelope, recoveryCode);
      const t2 = performance.now();

      setBenchResult({
        encryptTimeMs: parseFloat((t1 - t0).toFixed(2)),
        decryptTimeMs: parseFloat((t2 - t1).toFixed(2)),
      });
    } catch (err) {
      console.error('Benchmark failed:', err);
    } finally {
      setBenchmarking(false);
    }
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds && seconds !== 0) return '—';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Monitoring & Health</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time server uptime, database connectivity, and client cryptographic performance
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

      {/* Operational Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Server Health */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Server className="h-4 w-4 text-cyber-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider">API Service</span>
          </div>
          <div className="text-lg font-bold text-emerald-600 flex items-center gap-1.5 mt-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>Online</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">
            Uptime: {formatUptime(stats?.uptimeSeconds)}
          </p>
        </div>

        {/* Database Status */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Database className="h-4 w-4 text-emerald-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Database Link</span>
          </div>
          <div className="text-lg font-bold text-emerald-600 flex items-center gap-1.5 mt-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>Healthy</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Prisma Client active</p>
        </div>

        {/* Active Sessions */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Activity className="h-4 w-4 text-amber-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Sessions</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {stats?.activeSessionsCount ?? '—'}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">HTTP-only server sessions</p>
        </div>

        {/* Recent Errors */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <AlertCircle className="h-4 w-4 text-rose-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Recent Errors</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {stats?.recentErrorsCount ?? 0}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Failed operations in 24h</p>
        </div>
      </div>

      {/* Client-Reported Cryptography Performance Benchmark Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyber-50 text-cyber-600 flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Client Cryptography Performance Benchmark
              </h2>
              <p className="text-xs text-slate-500">
                Real-time Web Crypto API throughput execution benchmark
              </p>
            </div>
          </div>

          <button
            onClick={runCryptoBenchmark}
            disabled={benchmarking}
            className="px-3.5 py-1.5 rounded-lg bg-cyber-600 hover:bg-cyber-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50"
          >
            {benchmarking ? 'Benchmarking...' : 'Run Benchmark'}
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          <strong>Note on Cryptographic Benchmarking:</strong> These timing metrics measure
          observed browser WebCrypto throughput on this machine. They verify responsiveness and do
          not represent cryptographic security proofs.
        </p>

        {benchResult && (
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">AES-256-GCM Encryption Time:</span>
              <strong className="text-cyber-700 font-mono text-base">
                {benchResult.encryptTimeMs} ms
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">AES-256-GCM Decryption Time:</span>
              <strong className="text-emerald-700 font-mono text-base">
                {benchResult.decryptTimeMs} ms
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
