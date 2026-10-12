'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';
import { Shield, CheckCircle, ShieldAlert, ArrowRightLeft } from 'lucide-react';
import { ROLES } from '@passvault/shared';

export default function AdminRolesPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const fetchUsers = async () => {
    try {
      const data = await apiRequest('/admin/users');
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChangeRole = async (user: any, newRole: string) => {
    try {
      await apiRequest(`/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      setActionMsg(`Role for ${user.email} updated to ${newRole}.`);
      setTimeout(() => setActionMsg(''), 3000);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Role-Based Access Control (RBAC)</h1>
        <p className="text-xs text-slate-500 mt-1">
          Assign administrator and user roles across provisioned accounts
        </p>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Security Architectural Notice */}
      <div className="p-5 rounded-2xl bg-cyber-50/60 border border-cyber-100 flex items-start gap-4">
        <Shield className="h-6 w-6 text-cyber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-cyber-900 space-y-1">
          <strong className="block font-bold">Zero-Knowledge Administrator Boundary:</strong>
          <p className="text-cyber-800 leading-relaxed">
            Administrator permissions govern operational accounts, storage stats, and audit logs.
            In accordance with zero-knowledge cryptographic design, administrator privileges{' '}
            <strong>never provide access to user plaintext vault passwords, recovery codes, or derived keys</strong>.
          </p>
        </div>
      </div>

      {/* Role Management Card */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Manage Account Roles</h2>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading accounts...</div>
          ) : (
            users.map((u) => (
              <div key={u.id} className="py-4 flex items-center justify-between gap-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-900">{u.email}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        u.role === ROLES.ADMIN
                          ? 'bg-cyber-100 text-cyber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {u.role}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Created: {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {u.role === ROLES.ADMIN ? (
                    <button
                      onClick={() => handleChangeRole(u, ROLES.USER)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      Revoke Admin
                    </button>
                  ) : (
                    <button
                      onClick={() => handleChangeRole(u, ROLES.ADMIN)}
                      className="px-3 py-1.5 rounded-lg bg-cyber-600 hover:bg-cyber-700 text-white font-medium shadow-sm"
                    >
                      Make Admin
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
