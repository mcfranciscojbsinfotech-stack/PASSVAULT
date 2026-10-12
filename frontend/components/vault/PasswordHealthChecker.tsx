'use client';

import React, { useState, useMemo } from 'react';
import { VaultItemDecrypted, StorageMode } from '@passvault/shared';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  ExternalLink,
  Lock,
} from 'lucide-react';

interface PasswordHealthCheckerProps {
  credentials: VaultItemDecrypted[];
  isolatedCredentials: VaultItemDecrypted[];
  onEditCredential?: (item: VaultItemDecrypted) => void;
}

interface IssueItem {
  item: VaultItemDecrypted;
  issues: string[];
  severity: 'high' | 'medium' | 'low';
}

export function PasswordHealthChecker({
  credentials,
  isolatedCredentials,
  onEditCredential,
}: PasswordHealthCheckerProps) {
  const [expanded, setExpanded] = useState(false);

  const allItems = useMemo(
    () => [...credentials, ...isolatedCredentials],
    [credentials, isolatedCredentials]
  );

  const analysis = useMemo(() => {
    if (allItems.length === 0) {
      return {
        score: 100,
        weakCount: 0,
        reusedCount: 0,
        oldCount: 0,
        strongCount: 0,
        issues: [] as IssueItem[],
      };
    }

    // Map password frequencies
    const passwordCounts = new Map<string, number>();
    for (const item of allItems) {
      if (item.password) {
        passwordCounts.set(item.password, (passwordCounts.get(item.password) || 0) + 1);
      }
    }

    const now = Date.now();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

    const issues: IssueItem[] = [];
    let weakCount = 0;
    let reusedCount = 0;
    let oldCount = 0;
    let strongCount = 0;

    for (const item of allItems) {
      const p = item.password || '';
      const itemIssues: string[] = [];

      // Check length & complexity
      const hasLength = p.length >= 14;
      const hasUpper = /[A-Z]/.test(p);
      const hasLower = /[a-z]/.test(p);
      const hasNumber = /[0-9]/.test(p);
      const hasSymbol = /[^A-Za-z0-9]/.test(p);

      const isWeak = p.length < 12 || (!hasUpper && !hasSymbol) || (!hasNumber && !hasSymbol);
      if (p.length < 8) {
        itemIssues.push(`Critically short (${p.length} chars)`);
      } else if (p.length < 12) {
        itemIssues.push(`Short password (${p.length} chars)`);
      }

      if (!hasUpper && !hasLower) {
        itemIssues.push('Missing mixed case letters');
      }
      if (!hasNumber) {
        itemIssues.push('Missing numeric digits');
      }
      if (!hasSymbol) {
        itemIssues.push('Missing special symbols');
      }

      // Check reuse
      const count = passwordCounts.get(p) || 0;
      if (count > 1) {
        itemIssues.push(`Reused across ${count} accounts`);
      }

      // Check age
      const updatedAt = new Date(item.clientUpdatedAt || item.createdAt).getTime();
      const isOld = now - updatedAt > ninetyDaysMs;
      if (isOld) {
        itemIssues.push('Not updated in >90 days');
      }

      if (isWeak) weakCount++;
      if (count > 1) reusedCount++;
      if (isOld) oldCount++;

      if (!isWeak && count === 1 && !isOld && hasLength) {
        strongCount++;
      }

      if (itemIssues.length > 0) {
        const severity: 'high' | 'medium' | 'low' =
          p.length < 8 || count > 2 ? 'high' : isWeak || count > 1 ? 'medium' : 'low';
        issues.push({ item, issues: itemIssues, severity });
      }
    }

    // Deduct points: weak -15 each, reused -20 each, old -5 each
    const deductions = weakCount * 15 + reusedCount * 20 + oldCount * 5;
    const score = Math.max(0, Math.min(100, Math.round(100 - (deductions / Math.max(1, allItems.length)) * 25)));

    return {
      score,
      weakCount,
      reusedCount,
      oldCount,
      strongCount,
      issues: issues.sort((a, b) => (a.severity === 'high' ? -1 : 1)),
    };
  }, [allItems]);

  if (allItems.length === 0) return null;

  const getScoreTheme = (score: number) => {
    if (score >= 80)
      return {
        badge: 'Excellent Health',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        ring: 'ring-emerald-500/20',
        bar: 'bg-emerald-500',
      };
    if (score >= 60)
      return {
        badge: 'Good Health',
        color: 'text-sky-700',
        bg: 'bg-sky-50',
        border: 'border-sky-200',
        ring: 'ring-sky-500/20',
        bar: 'bg-sky-500',
      };
    if (score >= 40)
      return {
        badge: 'Attention Needed',
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        ring: 'ring-amber-500/20',
        bar: 'bg-amber-500',
      };
    return {
      badge: 'Critical Vulnerabilities',
      color: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      ring: 'ring-rose-500/20',
      bar: 'bg-rose-500',
    };
  };

  const theme = getScoreTheme(analysis.score);

  return (
    <div
      className={`rounded-2xl border ${theme.border} ${theme.bg} p-5 shadow-sm transition-all`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left side: Score and Overview */}
        <div className="flex items-center gap-4">
          <div
            className={`h-16 w-16 rounded-2xl bg-white border ${theme.border} flex flex-col items-center justify-center shrink-0 shadow-sm`}
          >
            <span className={`text-xl font-extrabold ${theme.color}`}>{analysis.score}%</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Score
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Password Health Checker</h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${theme.color} bg-white border ${theme.border}`}
              >
                {theme.badge}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Zero-knowledge analysis evaluated {allItems.length} credentials entirely in browser
              memory.
            </p>
          </div>
        </div>

        {/* Right side: Action & Metrics */}
        <div className="flex items-center gap-3">
          {analysis.issues.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <span>{expanded ? 'Hide Issues' : `Review Issues (${analysis.issues.length})`}</span>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200/60">
        <div className="bg-white/80 p-3 rounded-xl border border-slate-200/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Weak Passwords
          </span>
          <span
            className={`text-lg font-bold ${
              analysis.weakCount > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {analysis.weakCount}
          </span>
        </div>

        <div className="bg-white/80 p-3 rounded-xl border border-slate-200/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Reused Across Accounts
          </span>
          <span
            className={`text-lg font-bold ${
              analysis.reusedCount > 0 ? 'text-amber-600' : 'text-emerald-600'
            }`}
          >
            {analysis.reusedCount}
          </span>
        </div>

        <div className="bg-white/80 p-3 rounded-xl border border-slate-200/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Old (&gt;90 Days)
          </span>
          <span
            className={`text-lg font-bold ${
              analysis.oldCount > 0 ? 'text-slate-700' : 'text-emerald-600'
            }`}
          >
            {analysis.oldCount}
          </span>
        </div>

        <div className="bg-white/80 p-3 rounded-xl border border-slate-200/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Strong & Unique
          </span>
          <span className="text-lg font-bold text-emerald-600">{analysis.strongCount}</span>
        </div>
      </div>

      {/* Expanded Issues List */}
      {expanded && analysis.issues.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200/60 space-y-2">
          <h4 className="text-xs font-bold text-slate-800 mb-2">Vulnerable Credential Entries:</h4>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {analysis.issues.map(({ item, issues, severity }) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-sm text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{item.title}</span>
                    {item.username && (
                      <span className="text-slate-400 font-mono text-[11px]">
                        ({item.username})
                      </span>
                    )}
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        severity === 'high'
                          ? 'bg-rose-100 text-rose-800'
                          : severity === 'medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {severity} risk
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {issues.map((iss, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600"
                      >
                        • {iss}
                      </span>
                    ))}
                  </div>
                </div>

                {onEditCredential && (
                  <button
                    onClick={() => onEditCredential(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyber-50 hover:bg-cyber-100 text-cyber-700 text-xs font-semibold border border-cyber-200 transition-colors shrink-0 ml-3"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Update</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
