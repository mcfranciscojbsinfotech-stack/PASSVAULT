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
  Edit2,
  Trash2,
} from 'lucide-react';
import { ROLES } from '@passvault/shared';

export default function AdminUsersPage() {
  const { isPrimaryAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  // Add Account Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<string>(ROLES.USER);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit User Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editRole, setEditRole] = useState<string>(ROLES.USER);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

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

  const handleToggleSuspend = async (targetUser: any) => {
    try {
      await apiRequest(`/admin/users/${targetUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isSuspended: !targetUser.isSuspended }),
      });
      setActionMsg(`Account ${targetUser.email} status updated successfully.`);
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');

    try {
      const res = await apiRequest('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          firstName: newFirstName.trim(),
          lastName: newLastName.trim(),
          email: newEmail.trim(),
          contactNumber: newContact.trim(),
          dateOfBirth: newDob,
          password: newPassword,
          role: newRole,
        }),
      });

      setActionMsg(`Account ${res.user.email} (${res.user.role}) created successfully.`);
      setTimeout(() => setActionMsg(''), 4000);
      setAddModalOpen(false);

      // Reset form
      setNewFirstName('');
      setNewLastName('');
      setNewEmail('');
      setNewContact('');
      setNewDob('');
      setNewPassword('');
      setNewRole(ROLES.USER);

      await fetchUsers();
    } catch (err: any) {
      setAddError(err.message || 'Failed to create user account');
    } finally {
      setAddLoading(false);
    }
  };

  const openEditModal = (targetUser: any) => {
    setEditingUser(targetUser);
    setEditFirstName(targetUser.firstName || '');
    setEditLastName(targetUser.lastName || '');
    setEditContact(targetUser.contactNumber || '');
    setEditDob(targetUser.dateOfBirth || '');
    setEditRole(targetUser.role || ROLES.USER);
    setEditError('');
    setEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditLoading(true);
    setEditError('');

    try {
      await apiRequest(`/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: editFirstName.trim(),
          lastName: editLastName.trim(),
          contactNumber: editContact.trim(),
          dateOfBirth: editDob || undefined,
          role: editRole,
        }),
      });

      setActionMsg(`Account ${editingUser.email} details updated successfully.`);
      setTimeout(() => setActionMsg(''), 4000);
      setEditModalOpen(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update user account');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Directory &amp; Provisioning</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review registered users, edit profile details, manage suspension status, and provision
            accounts
          </p>
        </div>

        <button
          onClick={() => {
            setNewRole(ROLES.USER);
            setAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md transition-all"
        >
          <UserPlus className="h-4 w-4 text-cyber-400" />
          <span>Add Account / Sub-Admin</span>
        </button>
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
                <th className="py-3 px-4">Contact &amp; DOB</th>
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
                          ? `${u.firstName || ''} ${u.lastName || ''}`.trim()
                          : 'Standard User'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider ${
                          u.role === ROLES.ADMIN
                            ? 'bg-slate-900 text-amber-300'
                            : u.role === ROLES.SUB_ADMIN
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-sky-100 text-sky-800 border border-sky-200'
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
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* Edit User Button */}
                      <button
                        onClick={() => openEditModal(u)}
                        className="px-2.5 py-1 rounded text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-colors inline-flex items-center gap-1"
                      >
                        <Edit2 className="h-3 w-3 text-slate-500" />
                        <span>Edit</span>
                      </button>

                      {/* Suspend / Reactivate */}
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

                      {/* Revoke Sessions */}
                      <button
                        onClick={() => handleRevokeSessions(u.id)}
                        className="px-2 py-1 rounded text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
                        title="Revoke All Sessions"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Account Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-slate-900 text-cyber-400 flex items-center justify-center">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Provision Account</h2>
                  <p className="text-[11px] text-slate-500">
                    Create a pre-verified user or secondary administrator account
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {addError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 mt-4 text-xs">
              {/* Account Role Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                >
                  <option value={ROLES.USER}>Standard User (Vault Owner)</option>
                  {isPrimaryAdmin && (
                    <option value={ROLES.SUB_ADMIN}>Sub-Administrator (Admin Console)</option>
                  )}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  {newRole === ROLES.SUB_ADMIN
                    ? 'Sub-administrators have administrative console access but cannot modify primary admins.'
                    : 'Standard users operate isolated client vaults with zero administrative access.'}
                </p>
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="Alice"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Smith"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="alice@passvault.local"
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Contact & Date of Birth */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="tel"
                      value={newContact}
                      onChange={(e) => setNewContact(e.target.value)}
                      placeholder="+1-555-0199"
                      className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="date"
                      value={newDob}
                      onChange={(e) => setNewDob(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Password will be hashed using Argon2id. Account is pre-verified upon creation.
                </p>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  {addLoading ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5 text-cyber-400" />
                  )}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-cyber-50 text-cyber-600 flex items-center justify-center">
                  <Edit2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Edit User Details</h2>
                  <p className="text-[11px] text-slate-500">
                    Update permitted profile and role attributes for {editingUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {editError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-4 mt-4 text-xs">
              {/* Role Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  disabled={editingUser.role === ROLES.ADMIN && !isPrimaryAdmin}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                >
                  <option value={ROLES.USER}>Standard User</option>
                  <option value={ROLES.SUB_ADMIN}>Sub-Administrator</option>
                  {isPrimaryAdmin && <option value={ROLES.ADMIN}>Primary Administrator</option>}
                </select>
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Contact & Date of Birth */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="tel"
                      value={editContact}
                      onChange={(e) => setEditContact(e.target.value)}
                      placeholder="+1-555-0100"
                      className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="date"
                      value={editDob}
                      onChange={(e) => setEditDob(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 rounded-xl bg-cyber-600 hover:bg-cyber-700 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  {editLoading ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
