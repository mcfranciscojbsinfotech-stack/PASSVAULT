'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  KeyRound,
  ShieldAlert,
  Dices,
  Binary,
  RefreshCw,
  HardDriveDownload,
  ShieldCheck,
  Settings,
  Users,
  Shield,
  Activity,
  Network,
  Database,
  FileText,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const mainLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Credentials', href: '/vault', icon: KeyRound },
    {
      label: 'Isolate Mode',
      href: '/isolate',
      icon: ShieldAlert,
      badge: 'Local Only',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    { label: 'Password Generator', href: '/generator', icon: Dices },
    { label: 'Encrypt / Decrypt', href: '/encrypt-decrypt', icon: Binary },
    { label: 'Cloud Sync', href: '/synchronization', icon: RefreshCw },
    { label: 'Backup & Restore', href: '/backups', icon: HardDriveDownload },
    { label: 'Security & 2FA', href: '/security', icon: ShieldCheck },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const adminLinks = [
    { label: 'User Directory', href: '/admin/users', icon: Users },
    { label: 'Role Permissions', href: '/admin/roles', icon: Shield },
    { label: 'Storage Metrics', href: '/admin/storage', icon: Database },
    { label: 'System Monitoring', href: '/admin/monitoring', icon: Activity },
    { label: 'Network & CORS', href: '/admin/network', icon: Network },
    { label: 'Security Events', href: '/admin/security', icon: ShieldCheck },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Personal Vault
          </p>
          <nav className="mt-2 space-y-1">
            {mainLinks.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'bg-cyber-50 text-cyber-700 font-semibold border border-cyber-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${active ? 'text-cyber-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {isAdmin && (
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-cyber-600">
              System Administration
            </p>
            <nav className="mt-2 space-y-1">
              {adminLinks.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? 'bg-cyber-50 text-cyber-700 font-semibold border border-cyber-100'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-cyber-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
        PassVault v1.0 • Client AES-GCM
      </div>
    </aside>
  );
}
