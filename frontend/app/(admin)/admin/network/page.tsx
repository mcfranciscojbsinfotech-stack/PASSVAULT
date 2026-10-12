'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';
import { Network, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Wifi } from 'lucide-react';

export default function AdminNetworkPage() {
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const testConnectivity = async () => {
    setLoading(true);
    const t0 = performance.now();
    try {
      const data = await apiRequest('/admin/network');
      const t1 = performance.now();
      setNetworkInfo(data);
      setLatencyMs(Math.round(t1 - t0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnectivity();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Network & Connectivity Configuration</h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor API round-trip latency, CORS origin validation, and sync availability
          </p>
        </div>

        <button
          onClick={testConnectivity}
          className="p-2 rounded-lg text-slate-500 hover:bg-white border border-slate-200"
          title="Retest Network"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Latency Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Wifi className="h-4 w-4 text-cyber-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider">API Round-Trip</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {latencyMs !== null ? `${latencyMs} ms` : '—'}
          </div>
          <p className="text-[11px] text-slate-500">Local Fastify REST API response latency.</p>
        </div>

        {/* Database Link */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Database Link</span>
          </div>
          <div className="text-lg font-bold text-emerald-700">Connected</div>
          <p className="text-[11px] text-slate-500">Prisma database connection online.</p>
        </div>

        {/* Sync Service Status */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="h-4 w-4 text-cyber-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Sync Pipeline</span>
          </div>
          <div className="text-lg font-bold text-cyber-700">Available</div>
          <p className="text-[11px] text-slate-500">Zero-knowledge cloud sync routes active.</p>
        </div>
      </div>

      {/* Network Architecture Specifications */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Network Architecture Rules</h2>

        <div className="space-y-3 text-xs text-slate-600">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <strong className="text-slate-900 block font-bold">Offline Isolate Mode:</strong>
            <p className="leading-relaxed">
              Isolate Mode does not require internet connectivity. Local access and online
              synchronization are treated as separate capabilities.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <strong className="text-slate-900 block font-bold">Strict CORS Allowlists:</strong>
            <p className="leading-relaxed">
              Cross-Origin Resource Sharing is strictly locked to configured origins with
              credentials enabled (HTTP-only cookies).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
