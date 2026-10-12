'use client';

import { useState, useEffect } from 'react';
import { Settings, Shield, Bell, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [toast, setToast] = useState<{type: 'success'|'error', msg: string}|null>(null);
  
  // States
  const [profile, setProfile] = useState<any>({ name: '', supportEmail: '', domainContext: '', settings: { notifications: { emailAlerts: true, inAppAlerts: true } } });
  const [userProfile, setUserProfile] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'VIEWER' });

  const fetchProfile = async () => {
    try {
      const data = await apiFetch('/settings/profile');
      if (data) setProfile(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const data = await apiFetch('/settings/users/me');
      if (data) setUserProfile(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await apiFetch<any[]>('/settings/users');
      if (data) setUsers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch<any[]>('/settings/notifications');
      if (data) setNotifications(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchUserProfile();
    fetchUsers();
    fetchNotifications();
  }, []);

  const showToast = (type: 'success'|'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const saveProfile = async () => {
    if (!profile.name?.trim()) {
      showToast('error', 'Profile name cannot be empty.');
      return;
    }
    try {
      await apiFetch('/settings/profile', {
        method: 'PUT',
        body: JSON.stringify(profile)
      });
      showToast('success', 'Profile saved successfully!');
    } catch (e) {
      showToast('error', 'Failed to save profile. Ensure you have admin rights.');
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      await apiFetch(`/settings/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
      });
      fetchUsers();
      showToast('success', 'User role updated.');
    } catch (e) {
      showToast('error', 'Failed to update user role.');
    }
  };

  const handleInviteUser = async () => {
    try {
      const subject = encodeURIComponent('SpatialOS Access Request');
      const body = encodeURIComponent(
        `Hello,\n\nPlease grant access to the following user:\n\nName: ${newUser.name}\nEmail: ${newUser.email}\nRequested Role: ${newUser.role}\n\nRequested By: ${userProfile?.name || 'Admin'} (${userProfile?.email || ''})\n\nThanks!`
      );
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=paanda.group@gmail.com&su=${subject}&body=${body}`, '_blank');

      setShowInviteForm(false);
      setNewUser({ name: '', email: '', role: 'VIEWER' });
      showToast('success', 'Email client opened successfully.');
    } catch (e) {
      showToast('error', 'Failed to open email client.');
    }
  };

  const saveUserProfile = async () => {
    try {
      await apiFetch('/settings/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ name: userProfile?.name })
      });
      fetchUserProfile();
      window.dispatchEvent(new Event('profile-updated'));
      showToast('success', 'Personal profile updated!');
    } catch (e) {
      showToast('error', 'Failed to update personal profile.');
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await apiFetch(`/settings/notifications/${id}/read`, { method: 'PATCH' });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Configure organization profile details, IAM access, and notification feeds.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left Nav menu */}
        <div className="space-y-1 md:col-span-1">
          {[
            { id: 'profile', label: 'General Profile', icon: Settings },
            { id: 'iam', label: 'Security & Access', icon: Shield },
            { id: 'notifications', label: 'Notifications', icon: Bell },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive 
                    ? 'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-700 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Form area */}
        <div className="md:col-span-3">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              
              {/* My Profile Section */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl p-6 space-y-6">
                <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">My Profile</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={userProfile?.name || ''}
                      onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      placeholder="Your Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-lg px-4 py-2 text-sm text-slate-500 dark:text-slate-400">
                        {userProfile?.email || 'Loading...'}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Read-Only</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Role</label>
                    <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-lg px-4 py-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {userProfile?.role || 'Loading...'}
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button onClick={saveUserProfile} className="bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm">
                    Save Profile
                  </button>
                </div>
              </div>

              {/* Organization Profile Section */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl p-6 space-y-6">
                <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">Organization Profile</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Organization Name</label>
                  <input 
                    type="text" 
                    value={profile.name || ''}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Primary Domain Context</label>
                  <select 
                    value={profile.domainContext || ''}
                    onChange={(e) => setProfile({...profile, domainContext: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="">Select Domain...</option>
                    <option value="education">Educational Institution</option>
                    <option value="hospital">Healthcare / Hospital</option>
                    <option value="corporate">Corporate Office</option>
                    <option value="retail">Retail / Mall</option>
                  </select>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Governs base taxonomy, default services, and metadata schema limits.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Support Contact Email</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="email" 
                      value={profile.supportEmail || 'spatialos.official@gmail.com'}
                      readOnly
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-lg px-4 py-2 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed focus:outline-none"
                    />
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-white dark:bg-slate-800 px-2 py-1 rounded">Read-Only</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Contact your system administrator to change the main organization support email.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button onClick={saveProfile} className="bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
          )}

          {/* IAM TAB */}
          {activeTab === 'iam' && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Identity & Access Management (IAM)</h2>
                <button onClick={() => setShowInviteForm(!showInviteForm)} className="bg-indigo-600 text-slate-900 dark:text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-500">
                  {showInviteForm ? 'Cancel' : 'Request User Access'}
                </button>
              </div>

              {showInviteForm && (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3 mb-6">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Request User Access</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <input type="text" placeholder="Full Name" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white rounded px-3 py-2" />
                    <input type="email" placeholder="Email Address" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white rounded px-3 py-2" />
                    <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white rounded px-3 py-2">
                      <option value="ADMIN">Admin</option>
                      <option value="EDITOR">Editor</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                  </div>
                  <button onClick={handleInviteUser} className="bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white text-xs font-bold px-4 py-2 rounded">Send Request</button>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">User</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3 rounded-tr-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">No users found. Ensure backend is running and seeded.</td>
                      </tr>
                    )}
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-slate-200 dark:border-slate-700/50 last:border-0 hover:bg-slate-750">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{u.name}</td>
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3">
                          <select 
                            value={u.role}
                            onChange={(e) => updateUserRole(u.id, e.target.value)}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs rounded px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="OWNER">Owner</option>
                            <option value="ADMIN">Admin</option>
                            <option value="EDITOR">Editor</option>
                            <option value="VIEWER">Viewer</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <button className="text-red-400 hover:text-red-300 text-xs font-bold">Revoke</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl p-6 space-y-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">In-App Notifications</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Email Alerts</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Receive critical system alerts via email.</p>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input type="checkbox" checked={profile.settings?.notifications?.emailAlerts} onChange={async (e) => {
                      const newProf = {...profile};
                      if (!newProf.settings) newProf.settings = { notifications: {} };
                      newProf.settings.notifications.emailAlerts = e.target.checked;
                      setProfile(newProf);
                      try {
                        await apiFetch('/settings/profile', { method: 'PUT', body: JSON.stringify(newProf) });
                        showToast('success', 'Email alerts preference updated');
                      } catch (err) {}
                    }} className="checked:bg-indigo-500 outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 checked:border-indigo-500 top-0 left-0" />
                    <label className="block overflow-hidden h-6 rounded-full bg-slate-100 dark:bg-slate-700 cursor-pointer"></label>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">In-App Feed</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Log events and actions in the feed below.</p>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input type="checkbox" checked={profile.settings?.notifications?.inAppAlerts} onChange={async (e) => {
                      const newProf = {...profile};
                      if (!newProf.settings) newProf.settings = { notifications: {} };
                      newProf.settings.notifications.inAppAlerts = e.target.checked;
                      setProfile(newProf);
                      try {
                        await apiFetch('/settings/profile', { method: 'PUT', body: JSON.stringify(newProf) });
                        showToast('success', 'In-App feed preference updated');
                      } catch (err) {}
                    }} className="checked:bg-indigo-500 outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 checked:border-indigo-500 top-0 left-0" />
                    <label className="block overflow-hidden h-6 rounded-full bg-slate-100 dark:bg-slate-700 cursor-pointer"></label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {notifications.length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No new notifications. You&apos;re all caught up!
                  </div>
                )}
                {notifications.map(n => (
                  <div key={n.id} className={`flex justify-between items-start p-4 rounded-lg border ${n.isRead ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800' : 'bg-white dark:bg-slate-800 border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.1)]'}`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${n.type === 'ALERT' ? 'bg-red-500/20 text-red-400' : n.type === 'SYSTEM' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>{n.type}</span>
                        <h4 className={`text-sm font-bold ${n.isRead ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>{n.title}</h4>
                      </div>
                      <p className={`text-xs ${n.isRead ? 'text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>{n.message}</p>
                      <span className="text-[10px] text-slate-500 mt-2 block">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    {!n.isRead && (
                      <button onClick={() => markNotificationRead(n.id)} className="text-indigo-400 hover:text-indigo-300" title="Mark as read">
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-lg shadow-lg text-sm font-bold flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-900 border border-emerald-500 text-emerald-100' : 'bg-red-900 border border-red-500 text-red-100'
          }`}>
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
