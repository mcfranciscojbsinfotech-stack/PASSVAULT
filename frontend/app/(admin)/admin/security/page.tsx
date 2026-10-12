'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';
import { ShieldCheck, ShieldAlert, AlertTriangle, KeyRound, Lock, RefreshCw } from 'lucide-react';

export default function AdminSecurityPage() {
  const [stats, setStats] = useState<any>(null);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSecurityData = async () => {
    try {
      const [mon, logs] = await Promise.all([
        apiRequest('/admin/monitoring'),
        apiRequest('/admin/audit-logs?limit=25'),
      ]);
      setStats(mon);
      setSecurityEvents(logs.auditLogs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Security Management & Events</h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor authentication attempts, rate limiting, and session security status
          </p>
        </div>

        <button
          onClick={fetchSecurityData}
          className="p-2 rounded-lg text-slate-500 hover:bg-white border border-slate-200"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Audit Events */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="h-4 w-4 text-cyber-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Audit Events</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats?.auditEventsCount ?? '—'}</div>
          <p className="text-[10px] text-slate-500">Immutable security audit logs</p>
        </div>

        {/* Failed Security Events */}
        <div className="p-5 rounded-2xl bg-white border border-rose-200 shadow-sm space-y-2 ring-1 ring-rose-500/10">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Failed Operations</span>
          </div>
          <div className="text-2xl font-extrabold text-rose-900">
            {stats?.recentErrorsCount ?? 0}
          </div>
          <p className="text-[10px] text-rose-600 font-semibold">Failed logins or MFA attempts in 24h</p>
        </div>

        {/* Active Sessions */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Lock className="h-4 w-4 text-emerald-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Sessions</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {stats?.activeSessionsCount ?? '—'}
          </div>
          <p className="text-[10px] text-slate-500">Subject to inactivity timeouts</p>
        </div>
      </div>

      {/* Security Policies Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Enforced Security Policies</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <strong className="text-slate-900 block font-bold">Argon2id Password Hashing:</strong>
            <p className="text-slate-600 leading-relaxed">
              Account passwords use Argon2id with 64 MB memory and 3 time cost. Never stored as
              plaintext or reversible encryption.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <strong className="text-slate-900 block font-bold">Client Clipboard Security:</strong>
            <p className="text-slate-600 leading-relaxed">
              Best-effort clipboard clearing after 30 seconds. Note: Operating-system clipboard
              managers or third-party clip utilities may retain history outside browser control.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Security Activity Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Recent Security Activity</h2>

        <div className="divide-y divide-slate-100 text-xs">
          {securityEvents.slice(0, 10).map((ev) => (
            <div key={ev.id} className="py-3 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-900">{ev.eventType}</span>
                <p className="text-[11px] text-slate-500">
                  Actor: {ev.actorEmail || 'System/Anonymous'} • IP: {ev.ipAddress || 'Local'}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                    ev.status === 'SUCCESS'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {ev.status}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  {new Date(ev.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
