'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useVault } from '@/lib/vault-context';
import { Shield, Lock, Unlock, LogOut, User, Sparkles } from 'lucide-react';

export function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { isUnlocked, lockVault, openUnlockModal } = useVault();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyber-100 bg-white/95 backdrop-blur shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyber-700 to-cyber-500 flex items-center justify-center text-white shadow-md shadow-cyber-500/20 group-hover:scale-105 transition-transform">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyber-900 via-cyber-700 to-cyber-600 bg-clip-text text-transparent">
                PassVault
              </span>
              <span className="block text-[10px] font-semibold tracking-wider text-cyber-600 uppercase">
                Zero-Knowledge Isolated
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Vault Lock / Unlock Status Pill */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
              isUnlocked
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 transition-colors'
            }`}
          >
            {isUnlocked ? (
              <>
                <Unlock className="h-3.5 w-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Vault Unlocked</span>
                <button
                  onClick={lockVault}
                  className="ml-1 text-[11px] underline hover:text-emerald-900"
                  title="Lock Vault Now"
                >
                  Lock
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={openUnlockModal}
                className="flex items-center gap-1.5 cursor-pointer text-amber-800 hover:text-amber-950"
                title="Click to Unlock Vault"
              >
                <Lock className="h-3.5 w-3.5 text-amber-600" />
                <span>Vault Locked &bull; Unlock</span>
              </button>
            )}
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800">{user.email}</span>
                <span className="text-[10px] font-medium text-cyber-600">
                  {isAdmin ? 'ADMINISTRATOR' : 'USER'}
                </span>
              </div>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyber-50 text-cyber-700 hover:bg-cyber-100 border border-cyber-200 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-cyber-600" />
                  Admin Console
                </Link>
              )}

              <button
                onClick={logout}
                className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-cyber-700 hover:bg-cyber-50"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-cyber-600 hover:bg-cyber-700 shadow-sm"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
