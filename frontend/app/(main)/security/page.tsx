'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api-client';
import {
  ShieldCheck,
  Smartphone,
  KeyRound,
  Laptop,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

export default function SecurityPage() {
  const { user, refreshUser } = useAuth();

  // MFA Setup state
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [verifyToken, setVerifyToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const data = await apiRequest('/sessions');
      setSessions(data.sessions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleStartSetup = async () => {
    setMfaLoading(true);
    setMfaError('');
    try {
      const data = await apiRequest('/mfa/setup', { method: 'POST' });
      setSetupData(data);
    } catch (err: any) {
      setMfaError(err.message || 'Failed to initialize MFA setup');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleConfirmEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaLoading(true);
    setMfaError('');
    try {
      const data = await apiRequest('/mfa/enable', {
        method: 'POST',
        body: JSON.stringify({ token: verifyToken }),
      });
      setBackupCodes(data.backupCodes || []);
      setSetupData(null);
      await refreshUser();
    } catch (err: any) {
      setMfaError(err.message || 'Invalid verification token');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaLoading(true);
    setMfaError('');
    try {
      await apiRequest('/mfa/disable', {
        method: 'POST',
        body: JSON.stringify({ password: disablePassword }),
      });
      setShowDisableForm(false);
      setDisablePassword('');
      await refreshUser();
    } catch (err: any) {
      setMfaError(err.message || 'Failed to disable MFA');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await apiRequest('/sessions/revoke', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });
      await fetchSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeAllOthers = async () => {
    try {
      await apiRequest('/sessions/revoke-all-others', { method: 'POST' });
      await fetchSessions();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Security & Session Management</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure two-factor authentication and monitor authorized browser sessions
        </p>
      </div>

      {/* MFA Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyber-50 text-cyber-600 flex items-center justify-center">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                TOTP Two-Factor Authentication (2FA)
              </h2>
              <p className="text-xs text-slate-500">
                Protect account logins with Google Authenticator, Authy, or compatible apps
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              user?.mfaEnabled
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {user?.mfaEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {mfaError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{mfaError}</span>
          </div>
        )}

        {/* Backup Codes Display */}
        {backupCodes.length > 0 && (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Two-Factor Authentication Successfully Configured!</span>
            </div>
            <p className="text-[11px] text-emerald-800">
              Save these single-use emergency backup recovery codes in a safe location:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs font-bold text-emerald-950">
              {backupCodes.map((c, i) => (
                <div key={i} className="p-2 rounded bg-white/80 border border-emerald-300 text-center">
                  {c}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Setup Flow */}
        {!user?.mfaEnabled ? (
          setupData ? (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-900">Scan QR Code with Authenticator App</h3>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <img
                  src={setupData.qrCodeDataUrl}
                  alt="MFA QR Code"
                  className="h-36 w-36 rounded-xl border border-slate-200 p-2 bg-white"
                />
                <div className="space-y-2 text-xs text-slate-600">
                  <p>Or manually enter secret key:</p>
                  <div className="font-mono text-xs font-bold text-slate-900 bg-white p-2.5 rounded-lg border border-slate-200 select-all">
                    {setupData.secret}
                  </div>
                </div>
              </div>

              <form onSubmit={handleConfirmEnable} className="flex gap-2 max-w-sm pt-2">
                <input
                  type="text"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono text-center tracking-widest focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  disabled={mfaLoading}
                  className="px-4 py-2 rounded-lg bg-cyber-600 hover:bg-cyber-700 text-white text-xs font-semibold shadow-sm"
                >
                  {mfaLoading ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </form>
            </div>
          ) : (
            <button
              onClick={handleStartSetup}
              disabled={mfaLoading}
              className="px-4 py-2 rounded-xl bg-cyber-600 hover:bg-cyber-700 text-white text-xs font-semibold shadow-sm"
            >
              {mfaLoading ? 'Starting...' : 'Enable Two-Factor Authentication'}
            </button>
          )
        ) : (
          <div>
            {showDisableForm ? (
              <form onSubmit={handleDisableMfa} className="space-y-3 p-4 rounded-xl bg-slate-50 border">
                <label className="block text-xs font-semibold text-slate-700">
                  Confirm Password to Disable 2FA
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Account password"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={mfaLoading}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                  >
                    Confirm Disable
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDisableForm(false)}
                    className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowDisableForm(true)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold border border-slate-200 transition-colors"
              >
                Disable Two-Factor Authentication
              </button>
            )}
          </div>
        )}
      </div>

      {/* Active Sessions Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyber-50 text-cyber-600 flex items-center justify-center">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Active Authorized Sessions</h2>
              <p className="text-xs text-slate-500">
                Server-managed HTTP-only sessions logged in on your devices
              </p>
            </div>
          </div>

          <button
            onClick={handleRevokeAllOthers}
            className="text-xs font-semibold text-rose-600 hover:underline"
          >
            Revoke All Other Sessions
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {sessions.map((sess) => (
            <div key={sess.id} className="py-3.5 flex items-center justify-between text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">
                    {sess.ipAddress || '127.0.0.1'}
                  </span>
                  {sess.isCurrent && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      CURRENT SESSION
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-md">{sess.userAgent}</p>
                <p className="text-[10px] text-slate-400">
                  Last active: {new Date(sess.lastActiveAt).toLocaleString()}
                </p>
              </div>

              {!sess.isCurrent && (
                <button
                  onClick={() => handleRevokeSession(sess.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  title="Revoke session"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
