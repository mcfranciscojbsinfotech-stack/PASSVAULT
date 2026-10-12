'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  RefreshCw,
  HardDrive,
  Cpu,
  ArrowRight,
  Lock,
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-white to-cyber-50/50 border-b border-cyber-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyber-100 border border-cyber-200 text-cyber-800 text-xs font-semibold mb-6">
            <ShieldCheck className="h-4 w-4 text-cyber-600" />
            Zero-Knowledge AES-256-GCM Authenticated Encryption
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto">
            Web-Based Password Manager with{' '}
            <span className="bg-gradient-to-r from-cyber-700 via-cyber-600 to-cyber-500 bg-clip-text text-transparent">
              Isolated Local Storage
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            PassVault gives you true cryptographic sovereignty. Keep your most sensitive
            credentials strictly local in <strong>Isolate Mode</strong>, while selectively
            synchronizing everyday credentials using client-side zero-knowledge encryption.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyber-600 hover:bg-cyber-700 text-white font-semibold text-sm shadow-lg shadow-cyber-600/25 transition-all"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyber-600 hover:bg-cyber-700 text-white font-semibold text-sm shadow-lg shadow-cyber-600/25 transition-all"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all shadow-sm"
                >
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-12">
          Security Architecture & Technical Objectives
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Client AES-256-GCM */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-cyber-50 border border-cyber-100 flex items-center justify-center text-cyber-600 mb-4">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Browser Web Crypto API
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Standardized 25-character vault recovery code with HKDF-SHA-256 key derivation.
              Every record is sealed using AES-256-GCM with a fresh 96-bit IV before saving.
            </p>
          </div>

          {/* Card 2: Isolate Mode */}
          <div className="p-6 rounded-2xl bg-white border border-emerald-200/80 shadow-sm hover:shadow-md transition-shadow ring-1 ring-emerald-500/10">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Isolate Mode Partitioning
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Selected high-risk credentials reside in a physically segregated IndexedDB
              database. Completely excluded from the sync pipeline and network requests.
            </p>
          </div>

          {/* Card 3: Zero-Knowledge Sync */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-4">
              <RefreshCw className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Selective Cloud Sync
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Synchronize everyday credentials across authorized devices. The server receives
              only opaque versioned ciphertext envelopes—never passwords, usernames, or keys.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
        PassVault • Academic Web Development and System Administration Project
      </footer>
    </div>
  );
}
