'use client';

import { Search, Plus, Filter, User, MoreVertical, Shield, RefreshCw, X, Trash2, Edit2, Unlock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../lib/api';

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'EDITOR' });
  const [isSaving, setIsSaving] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<any[]>('/overview/users');
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiFetch('/overview/users', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setIsCreateModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'EDITOR' });
      fetchUsers();
    } catch (error: any) {
      alert(error.message || 'Error creating user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      await apiFetch(`/overview/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: formData.name, role: formData.role })
      });
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      alert(error.message || 'Error updating user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      await apiFetch(`/overview/users/${selectedUser.id}`, {
        method: 'DELETE'
      });
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      alert(error.message || 'Error deleting user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnlockUser = async (user: any) => {
    try {
      await apiFetch(`/overview/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Active' })
      });
      setActiveMenu(null);
      fetchUsers();
    } catch (error: any) {
      alert(error.message || 'Error unlocking user');
    }
  };

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role });
    setIsEditModalOpen(true);
    setActiveMenu(null);
  };

  const openDeleteModal = (user: any) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
    setActiveMenu(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Users & Access</h1>
          <p className="text-slate-400 mt-1 text-sm">Manage administrative members, access controls, and security policies</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ name: '', email: '', password: '', role: 'EDITOR' });
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 mb-6 shrink-0">
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'users' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Members ({users.length})
        </button>
        <button 
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'roles' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Roles & Permissions
        </button>
      </div>

      <div className="flex-1">
        {activeTab === 'users' ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search members by name or email..." 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            {/* List */}
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-700 text-xs uppercase font-semibold text-slate-400 tracking-wider">
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Last Active</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400">
                        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400 bg-slate-900 border-dashed">
                        No users available.
                      </td>
                    </tr>
                  ) : users.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-700 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-semibold text-sm uppercase">
                            {usr.name?.[0] || 'U'}
                          </div>
                          <span className="font-medium text-white">{usr.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-400">{usr.email}</td>
                      <td className="p-4 text-sm text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-indigo-500" />
                          {usr.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          usr.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {usr.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-400">{usr.activity}</td>
                      <td className="p-4 text-center relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === usr.id ? null : usr.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-700 rounded-md transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {activeMenu === usr.id && (
                          <div ref={menuRef} className="absolute right-8 top-10 w-48 bg-slate-800 rounded-lg shadow-lg border border-slate-700 py-1 z-10 text-left">
                            <button 
                              onClick={() => openEditModal(usr)}
                              className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" /> Edit Details
                            </button>
                            {usr.status === 'Locked' && (
                              <button 
                                onClick={() => handleUnlockUser(usr)}
                                className="w-full px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-50 flex items-center gap-2"
                              >
                                <Unlock className="w-4 h-4" /> Unlock Account
                              </button>
                            )}
                            <div className="h-px bg-slate-700 my-1"></div>
                            <button 
                              onClick={() => openDeleteModal(usr)}
                              className="w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" /> Delete User
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-200">Security Roles</h3>
            <p className="text-sm text-slate-400">Backend roles govern access privileges strictly. Permissions visible in the UI represent localized rules.</p>
            <div className="border border-slate-700 rounded-lg p-4 bg-slate-900 space-y-2">
              <p className="text-sm font-semibold text-slate-300">ADMIN</p>
              <p className="text-xs text-slate-400">Full platform execution, publishing rights, user provisioning, and service configuration overrides.</p>
            </div>
            <div className="border border-slate-700 rounded-lg p-4 bg-slate-900 space-y-2">
              <p className="text-sm font-semibold text-slate-300">EDITOR</p>
              <p className="text-xs text-slate-400">Create, edit, duplicate Places & Experiences. Save drafts. Cannot directly publish changes.</p>
            </div>
            <div className="border border-slate-700 rounded-lg p-4 bg-slate-900 space-y-2">
              <p className="text-sm font-semibold text-slate-300">VIEWER</p>
              <p className="text-xs text-slate-400">Read-only access to specific dashboards and reports.</p>
            </div>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-lg font-bold text-slate-200">Add New User</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="john@spatialos.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-800"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="EDITOR">EDITOR</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </div>
              <div className="pt-4 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-lg font-bold text-slate-200">Edit User Details</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                <input 
                  type="email" 
                  disabled
                  value={formData.email}
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900 text-slate-400 rounded-lg focus:outline-none cursor-not-allowed" 
                />
                <p className="text-xs text-slate-400 mt-1">Email address cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-800"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="EDITOR">EDITOR</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </div>
              <div className="pt-4 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Delete {selectedUser?.name}?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Are you sure you want to permanently delete this user account? This action cannot be undone and they will lose all access to the system.
            </p>
            <div className="flex items-center gap-3 w-full">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteUser}
                disabled={isSaving}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
