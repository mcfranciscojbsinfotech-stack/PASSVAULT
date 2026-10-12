'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import {
  Users,
  Shield,
  Activity,
  Database,
  ShieldCheck,
  FileText,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Lock,
  UserPlus,
  KeyRound,
  Server,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { ROLES } from '@passvault/shared';

export default function AdminDashboardOverviewPage() {
  const { user, isPrimaryAdmin } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOverviewData = async () => {
    try {
      const [monData, logsData] = await Promise.all([
        apiRequest('/admin/monitoring'),
        apiRequest('/admin/audit-logs?limit=8'),
      ]);
      setStats(monData);
      setRecentLogs(logsData.auditLogs || []);
    } catch (err) {
      console.error('Failed to load admin telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const formatUptime = (seconds: number) => {
    if (!seconds) return '0m';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-cyber-300">
              {isPrimaryAdmin ? 'Primary Administrator' : 'Sub-Administrator'}
            </span>
            <span className="text-xs text-slate-400 font-mono">System Console</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Administrator Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            System overview, account totals, security infrastructure telemetry, and operational
            monitoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOverviewData}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold shadow-sm transition-all"
            title="Refresh Metrics"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyber-600 hover:bg-cyber-700 text-white text-xs font-semibold shadow-md shadow-cyber-600/20 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>Manage Users</span>
          </Link>
        </div>
      </div>

      {/* Security Limitation Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-start gap-3.5 shadow-sm">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h3 className="font-bold text-amber-900">
            Zero-Knowledge Architecture Security Limitation
          </h3>
          <p className="text-amber-800 leading-relaxed">
            By cryptographic design, administrators cannot view or decrypt users&apos; stored
            passwords, secure notes, or root recovery keys. All vault encryption and decryption
            occurs exclusively on client devices via AES-256-GCM. Administrative capabilities are
            strictly confined to account lifecycle, session revocation, system telemetry, and
            operational audit logging.
          </p>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Registered Accounts
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {loading ? '—' : stats?.totalUsersCount ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
              <span className="text-cyber-600 font-semibold">
                {stats?.standardUsersCount ?? 0} Users
              </span>
              <span>•</span>
              <span className="text-indigo-600 font-semibold">
                {(stats?.subAdminUsersCount ?? 0) + (stats?.adminUsersCount ?? 0)} Admins
              </span>
            </div>
          </div>
          <div className="h-11 w-11 rounded-xl bg-cyber-50 text-cyber-600 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Active Sessions */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Sessions
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {loading ? '—' : stats?.activeSessionsCount ?? 0}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Authenticated</span>
            </div>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Lock className="h-5 w-5" />
          </div>
        </div>

        {/* Cloud Synced Items */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Encrypted Cloud Vaults
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {loading ? '—' : stats?.totalEncryptedItemsCount ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">AES-GCM Ciphertext Payloads</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Database className="h-5 w-5" />
          </div>
        </div>

        {/* System Uptime */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Server Uptime
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {loading ? '—' : formatUptime(stats?.uptimeSeconds || 0)}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Node / Fastify Healthy</span>
            </div>
          </div>
          <div className="h-11 w-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Activity className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Operational Modules Navigation Cards */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-4">Administration Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/users"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-cyber-300 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-cyber-50 text-cyber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-cyber-700 transition-colors">
                User Management &amp; Provisioning
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                View registered users, edit permitted details, toggle account suspension, and
                provision sub-admins.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-cyber-600">
              <span>Open Directory</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/admin/audit-logs"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-cyber-300 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-cyber-700 transition-colors">
                Audit Logs &amp; Activity
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Inspect structured security audit events, authentication attempts, session
                revocations, and admin actions.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-cyber-600">
              <span>View Audit Logs</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/admin/monitoring"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-cyber-300 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-cyber-700 transition-colors">
                System Telemetry &amp; Monitoring
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Monitor database connectivity, process memory, active session expiration, and error
                rates in real time.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-cyber-600">
              <span>View System Health</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/admin/roles"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-cyber-300 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-cyber-700 transition-colors">
                Role Management (RBAC)
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Manage role assignments between Primary Administrator, Sub-Administrator, and
                Standard User.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-cyber-600">
              <span>Configure Roles</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/admin/storage"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-cyber-300 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-cyber-700 transition-colors">
                Storage &amp; Server Backups
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Review database engines, tombstoned items, cloud storage isolation metrics, and
                server backup policies.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-cyber-600">
              <span>Review Storage</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/admin/security"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-cyber-300 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-cyber-700 transition-colors">
                Security Policies &amp; Login Activity
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Inspect authentication failures, brute-force security controls, session timeout
                rules, and CORS configurations.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-cyber-600">
              <span>Inspect Security</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Security & Operational Events Timeline */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Security &amp; Audit Events</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live audit stream recording recent authentication and administration activity
            </p>
          </div>
          <Link
            href="/admin/audit-logs"
            className="text-xs font-semibold text-cyber-600 hover:underline"
          >
            Full Log Viewer &rarr;
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No audit events logged yet.
            </div>
          ) : (
            recentLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                      log.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <div>
                    <div className="font-semibold text-slate-900 font-mono text-[11px]">
                      {log.eventType}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Actor: <span className="text-slate-700">{log.actorEmail || 'System'}</span>
                      {log.ipAddress && (
                        <span className="text-slate-400 font-mono ml-2">({log.ipAddress})</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      log.status === 'SUCCESS'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {log.status}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
