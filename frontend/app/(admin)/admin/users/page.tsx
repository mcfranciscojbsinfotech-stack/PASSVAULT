'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  Plus,
  X,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Lock,
  UserPlus,
  Phone,
  Calendar,
  Mail,
  User,
} from 'lucide-react';
import { ROLES } from '@passvault/shared';

export default function AdminUsersPage() {
  const { isPrimaryAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  // Sub-Admin Registration Modal State
  const [subAdminModalOpen, setSubAdminModalOpen] = useState(false);
  const [subAdminFirstName, setSubAdminFirstName] = useState('');
  const [subAdminLastName, setSubAdminLastName] = useState('');
  const [subAdminEmail, setSubAdminEmail] = useState('');
  const [subAdminContact, setSubAdminContact] = useState('');
  const [subAdminDob, setSubAdminDob] = useState('');
  const [subAdminPassword, setSubAdminPassword] = useState('');
  const [subAdminLoading, setSubAdminLoading] = useState(false);
  const [subAdminError, setSubAdminError] = useState('');

  const fetchUsers = async () => {
    try {
      const q = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
      const data = await apiRequest(`/admin/users${q}`);
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleToggleSuspend = async (user: any) => {
    try {
      await apiRequest(`/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isSuspended: !user.isSuspended }),
      });
      setActionMsg(`Account ${user.email} updated successfully.`);
      setTimeout(() => setActionMsg(''), 3000);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleRevokeSessions = async (userId: string) => {
    try {
      await apiRequest(`/admin/users/${userId}/revoke-sessions`, { method: 'POST' });
      setActionMsg('All active sessions for this user have been revoked.');
      setTimeout(() => setActionMsg(''), 3000);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleCreateSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubAdminLoading(true);
    setSubAdminError('');

    try {
      const res = await apiRequest('/admin/sub-admins', {
        method: 'POST',
        body: JSON.stringify({
          firstName: subAdminFirstName.trim(),
          lastName: subAdminLastName.trim(),
          email: subAdminEmail.trim(),
          contactNumber: subAdminContact.trim(),
          dateOfBirth: subAdminDob,
          password: subAdminPassword,
        }),
      });

      setActionMsg(`Sub-Admin account ${res.subAdmin.email} created successfully.`);
      setTimeout(() => setActionMsg(''), 4000);
      setSubAdminModalOpen(false);

      // Reset form
      setSubAdminFirstName('');
      setSubAdminLastName('');
      setSubAdminEmail('');
      setSubAdminContact('');
      setSubAdminDob('');
      setSubAdminPassword('');

      await fetchUsers();
    } catch (err: any) {
      setSubAdminError(err.message || 'Failed to create sub-admin account');
    } finally {
      setSubAdminLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Directory & Provisioning</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review registered users, manage suspension status, and provision sub-administrator
            accounts
          </p>
        </div>

        {isPrimaryAdmin && (
          <button
            onClick={() => setSubAdminModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md transition-all"
          >
            <UserPlus className="h-4 w-4 text-cyber-400" />
            <span>Register Sub-Admin</span>
          </button>
        )}
      </div>

      {actionMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts by name, email, or contact number..."
            className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
          />
        </div>
        <button
          onClick={fetchUsers}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Contact & DOB</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Active Sessions</th>
                <th className="py-3 px-4">Synced Items</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {u.firstName || u.lastName
                          ? `${u.firstName} ${u.lastName}`.trim()
                          : 'Standard User'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider ${
                          u.role === ROLES.ADMIN
                            ? 'bg-slate-900 text-cyber-300'
                            : u.role === ROLES.SUB_ADMIN
                            ? 'bg-cyber-100 text-cyber-800 border border-cyber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.role === ROLES.SUB_ADMIN ? 'Sub-Admin' : u.role}
                      </span>
                      {u.createdBy && (
                        <span className="block text-[9px] text-slate-400 mt-0.5">
                          Admin Provisioned
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{u.contactNumber || '—'}</div>
                      <div className="text-[10px] text-slate-400">
                        DOB: {u.dateOfBirth || '—'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          u.isSuspended
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {u.activeSessionsCount}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {u.encryptedVaultItemsCount}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleSuspend(u)}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                          u.isSuspended
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {u.isSuspended ? 'Reactivate' : 'Suspend'}
                      </button>
                      <button
                        onClick={() => handleRevokeSessions(u.id)}
                        className="px-2.5 py-1 rounded text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        Revoke Sessions
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Sub-Admin Modal */}
      {subAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-slate-900 text-cyber-400 flex items-center justify-center">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Register Sub-Administrator
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Create an authorized secondary administrator account
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSubAdminModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {subAdminError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{subAdminError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubAdmin} className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                <strong>Sub-Admin Privileges:</strong> Sub-admins can manage user directories,
                suspend abusive accounts, and review operational audit logs, but cannot alter
                primary administrator accounts.
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={subAdminFirstName}
                      onChange={(e) => setSubAdminFirstName(e.target.value)}
                      placeholder="Jane"
                      className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={subAdminLastName}
                      onChange={(e) => setSubAdminLastName(e.target.value)}
                      placeholder="Officer"
                      className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={subAdminEmail}
                    onChange={(e) => setSubAdminEmail(e.target.value)}
                    placeholder="subadmin@passvault.local"
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Contact Number and Date of Birth */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      value={subAdminContact}
                      onChange={(e) => setSubAdminContact(e.target.value)}
                      placeholder="+1 (555) 999-0000"
                      className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="date"
                      value={subAdminDob}
                      onChange={(e) => setSubAdminDob(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Temporary Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Temporary Authentication Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={subAdminPassword}
                    onChange={(e) => setSubAdminPassword(e.target.value)}
                    placeholder="At least 10 chars, uppercase, lowercase, number"
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSubAdminModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subAdminLoading}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
                >
                  {subAdminLoading ? 'Creating Sub-Admin...' : 'Register Sub-Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
