'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { useVault } from '@/lib/vault-context';
import { User, Lock, ShieldCheck, Mail, LogOut, Clock } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { isUnlocked, lockVault } = useVault();

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Account & Vault Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your account profile, verification status, and vault locking policies
        </p>
      </div>

      {/* Profile Details Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyber-50 text-cyber-600 flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">User Profile</h2>
            <p className="text-xs text-slate-500">Account identifiers and permission level</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block mb-1">Email Address</span>
            <span className="font-semibold text-slate-900">{user?.email}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block mb-1">Assigned Role</span>
            <span className="font-semibold text-slate-900">{user?.role}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block mb-1">Email Verification</span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <span
                className={`h-2 w-2 rounded-full ${
                  user?.isVerified ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>{user?.isVerified ? 'Verified' : 'Pending Verification'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block mb-1">Account Created</span>
            <span className="font-semibold text-slate-900">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Vault Auto-Lock Policy Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Automatic Inactivity Lock</h2>
            <p className="text-xs text-slate-500">
              Zero-knowledge in-memory key disposal policy
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          For your security, PassVault monitors browser mouse and keyboard activity. If no
          interaction is detected for <strong>15 minutes</strong>, your derived encryption key is
          erased from memory and the vault is locked automatically.
        </p>

        {isUnlocked && (
          <button
            onClick={lockVault}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Lock className="h-4 w-4" />
            <span>Lock Vault Immediately</span>
          </button>
        )}
      </div>

      {/* Sign Out Card */}
      <div className="p-6 rounded-2xl bg-white border border-rose-100 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Terminate Session</h2>
          <p className="text-xs text-slate-500">Sign out and revoke this browser session</p>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
