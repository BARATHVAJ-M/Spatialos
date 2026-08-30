'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Plus, Filter, MoreVertical, MapPin, Download, X, 
  Trash2, Edit3, Settings, Eye, CheckCircle2, AlertCircle, RefreshCw, Layers
} from 'lucide-react';
import Link from 'next/link';

import { apiFetch } from '../../lib/api';

import { Place } from '../../types/api';

export default function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedParent, setSelectedParent] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Modals & Drawers State
  const [deletingPlace, setDeletingPlace] = useState<Place | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);

  // Feedback Notification State
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Trigger temporary notification
  const triggerNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchPlaces = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<Place[]>('/places');
      setPlaces(data);
    } catch (err: any) {
      triggerNotification('error', err.message || 'Failed to fetch places');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  const handleRefresh = () => {
    fetchPlaces();
    triggerNotification('success', 'Places list synchronized successfully.');
  };

  // Filter Logic
  const filteredPlaces = places.filter((place) => {
    const status = place.status || 'Active';
    const type = place.type || 'Location';
    const parent = place.parentId || '-';

    // Tab Filter
    if (activeTab !== 'all' && status.toLowerCase() !== activeTab) return false;
    
    // Type Filter
    if (selectedType !== 'all' && type.toLowerCase() !== selectedType.toLowerCase()) return false;
    
    // Parent Filter
    if (selectedParent !== 'all' && parent.toLowerCase() !== selectedParent.toLowerCase()) return false;
    
    // Text Search
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      return (
        place.name.toLowerCase().includes(query) ||
        (place.qrTargetId && place.qrTargetId.toLowerCase().includes(query)) ||
        type.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Action Handlers
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlace) return;

    try {
      await apiFetch(`/places/${editingPlace.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: editingPlace.name }),
      });
      setPlaces(prev => prev.map(p => p.id === editingPlace.id ? editingPlace : p));
      setEditingPlace(null);
      triggerNotification('success', `Place "${editingPlace.name}" updated successfully.`);
    } catch (err: any) {
      triggerNotification('error', err.message || 'Failed to update place');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPlace) return;

    if (deleteConfirmationInput.trim() !== deletingPlace.name) {
      triggerNotification('error', 'Confirmation name does not match.');
      return;
    }

    try {
      await apiFetch(`/places/${deletingPlace.id}`, { method: 'DELETE' });
      setPlaces(prev => prev.filter(p => p.id !== deletingPlace.id));
      setDeletingPlace(null);
      setDeleteConfirmationInput('');
      triggerNotification('success', `Place "${deletingPlace.name}" deleted successfully.`);
    } catch (err: any) {
      triggerNotification('error', err.message || 'Failed to delete place');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative min-h-full flex flex-col space-y-6">
      
      {/* Dynamic Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl border animate-in slide-in-from-bottom duration-200 bg-slate-800 border-slate-700">
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
          <span className="text-sm font-semibold text-slate-200">{notification.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Places Control Plane</h1>
          <p className="text-slate-400 mt-1 text-sm">Create, query, configure and deploy physical anchors for spatial experiences</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="p-2 text-slate-400 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
            title="Synchronize Database"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link 
            href="/places/create" 
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Place
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 shrink-0 space-x-4">
        {['all', 'active', 'draft', 'archived'].map((tab) => (
          <button 
            key={tab}
            onClick={() => { setActiveTab(tab as any); }}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors capitalize ${
              activeTab === tab 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            {tab === 'all' ? 'All Places' : `${tab} Places`}
          </button>
        ))}
      </div>

      {/* Toolbar & Filter Panel */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-slate-700 flex flex-col gap-4 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Places by name, type, ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            {/* Filter Toggle */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-semibold transition-all ${
                showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Filter className="w-4 h-4" /> Filter Options
            </button>
          </div>

          {/* Collapsible Filter Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-900 rounded-lg border border-slate-800 animate-in slide-in-from-top duration-150">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Place Type</label>
                <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="building">Building</option>
                  <option value="floor">Floor</option>
                  <option value="room">Room</option>
                  <option value="entrance">Entrance</option>
                  <option value="department">Department</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Parent Location</label>
                <select 
                  value={selectedParent}
                  onChange={(e) => setSelectedParent(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="all">All Parents</option>
                  <option value="-">None (Root Level)</option>
                  <option value="main building">Main Building</option>
                  <option value="ground floor">Ground Floor</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Content Render (Table or Empty State) */}
        <div className="overflow-x-auto flex-1">
          {isLoading ? (
            /* Skeleton Loading State */
            <div className="divide-y divide-slate-800">
              {[1, 2, 3].map((s) => (
                <div key={s} className="p-5 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-700 rounded" />
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-700 rounded w-32" />
                      <div className="h-3 bg-slate-700 rounded w-16" />
                    </div>
                  </div>
                  <div className="h-4 bg-slate-700 rounded w-24" />
                </div>
              ))}
            </div>
          ) : filteredPlaces.length === 0 ? (
            /* Empty State */
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <Layers className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-base font-bold text-slate-200">No Places Found</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm">No locations match your search criteria. Try adjusting your query or filters.</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedType('all'); setSelectedParent('all'); }}
                className="mt-4 text-xs font-bold text-indigo-400 hover:text-indigo-700 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            /* Data Table */
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-700 text-xs uppercase tracking-wider font-semibold text-slate-400">
                  <th className="p-4">Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Parent</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Experiences</th>
                  <th className="p-4 text-right">Services</th>
                  <th className="p-4">Last Updated</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredPlaces.map((place) => (
                  <tr key={place.id} className="hover:bg-slate-700 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-slate-400">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <Link href={`/places/${place.id}`} className="font-semibold text-white hover:text-indigo-600 transition-colors block">
                            {place.name}
                          </Link>
                          <span className="text-[10px] text-slate-400 font-mono">{place.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-400">{place.type || 'Location'}</td>
                    <td className="p-4 text-sm text-slate-400">{place.parentId || '-'}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        (place.status || 'Active') === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                        (place.status || 'Active') === 'Draft' ? 'bg-slate-700 text-slate-300' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {place.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-400 text-right">{place._count?.experiences || 0}</td>
                    <td className="p-4 text-sm text-slate-400 text-right">{place._count?.services || 0}</td>
                    <td className="p-4 text-sm text-slate-400">{place.updatedAt || 'Recently'}</td>

                    {/* Actions Toolbar */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link href={`/places/${place.id}`} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-700 rounded" title="View details">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button onClick={() => setEditingPlace(place)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-500/10 rounded" title="Edit Place">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeletingPlace(place)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-500/10 rounded" title="Archive / Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Place Side Drawer (Section 7 Edit Workflow) */}
      {editingPlace && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingPlace(null)} />
          
          <form onSubmit={handleSaveEdit} className="relative w-full max-w-md bg-slate-800 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Edit Location</span>
                <h2 className="text-lg font-bold text-white mt-1">Configure {editingPlace.name}</h2>
              </div>
              <button type="button" onClick={() => setEditingPlace(null)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Place Name *</label>
                <input 
                  type="text" 
                  value={editingPlace.name}
                  onChange={(e) => setEditingPlace({...editingPlace, name: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Place Type</label>
                <select 
                  value={editingPlace.type}
                  onChange={(e) => setEditingPlace({...editingPlace, type: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                >
                  <option value="Building">Building</option>
                  <option value="Floor">Floor</option>
                  <option value="Room">Room</option>
                  <option value="Entrance">Entrance</option>
                  <option value="Department">Department</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Status</label>
                <select 
                  value={editingPlace.status}
                  onChange={(e) => setEditingPlace({...editingPlace, status: e.target.value as any})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Description</label>
                <textarea 
                  rows={4}
                  value={editingPlace.description}
                  onChange={(e) => setEditingPlace({...editingPlace, description: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 bg-slate-900 flex items-center justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setEditingPlace(null)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-900 transition-colors">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete / Archive Confirmation Modal (Section 29 Confirmation workflow) */}
      {deletingPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeletingPlace(null)} />
          
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md overflow-hidden relative z-10 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-700">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                Archive Place Location?
              </h3>
              <p className="text-xs text-slate-400 mt-1">This operation breaks active user experience anchor bindings.</p>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-400">
                To confirm archiving <span className="font-bold text-white">&quot;{deletingPlace.name}&quot;</span>, type the name of the place below:
              </p>
              
              <input 
                type="text" 
                placeholder={deletingPlace.name}
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 font-semibold"
              />
            </div>

            <div className="p-5 border-t border-slate-700 bg-slate-900 flex items-center justify-end gap-3">
              <button 
                type="button" 
                onClick={() => { setDeletingPlace(null); setDeleteConfirmationInput(''); }} 
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteConfirm}
                disabled={deleteConfirmationInput.trim() !== deletingPlace.name}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:bg-red-200 disabled:cursor-not-allowed"
              >
                Confirm Archive
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
