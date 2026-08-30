'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, MapPin, Sparkles, Navigation } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';

export default function CreatePlacePage() {
  const router = useRouter();

  // Generate random IDs on component mount
  const [systemId, setSystemId] = useState('');
  const [latLong, setLatLong] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [parent, setParent] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('draft');
  const [availableParents, setAvailableParents] = useState<any[]>([]);

  useEffect(() => {
    const randomHex = Math.random().toString(16).substring(2, 7).toUpperCase();
    setSystemId(`PLC-${randomHex}`);

    // Fetch available parents
    apiFetch<any[]>('/places').then((data) => {
      if (Array.isArray(data)) {
        setAvailableParents(data);
      }
    }).catch(err => console.error('Failed to load places for parent dropdown:', err));
  }, []);

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    router.back();
  };

  const handleGetLocation = () => {
    setIsLocating(true);
    setTimeout(() => {
      // Simulate getting coordinates
      const mockLat = (37.7749 + (Math.random() - 0.5) * 0.01).toFixed(4);
      const mockLng = (-122.4194 + (Math.random() - 0.5) * 0.01).toFixed(4);
      setLatLong(`${mockLat}, ${mockLng}`);
      setIsLocating(false);
    }, 1000);
  };

  const handleSave = async (redirect: boolean) => {
    try {
      const newPlace = await apiFetch<any>('/places', {
        method: 'POST',
        body: JSON.stringify({
          name,
          type,
          parent: parent || undefined,
          description,
          status,
          systemId,
          latLong
        })
      });

      if (redirect && newPlace?.id) {
        router.push(`/places/${newPlace.id}`);
      } else {
        router.push('/places');
      }
    } catch (err) {
      console.error('Failed to create place:', err);
      alert('Failed to create place.');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={handleCancel} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-700 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Place</h1>
          <p className="text-slate-400 mt-1 text-sm">Define a new physical location in your SpatialOS environment.</p>
        </div>
      </div>

      <form className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 space-y-8">
          
          {/* Section: Basic Info */}
          <section>
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Main Hospital Reception"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Place Type</label>
                <select 
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                >
                  <option value="">Select a type...</option>
                  <option value="building">Building</option>
                  <option value="floor">Floor</option>
                  <option value="room">Room</option>
                  <option value="entrance">Entrance</option>
                  <option value="outdoor">Outdoor Area</option>
                  <option value="department">Department</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Parent Place</label>
                <select 
                  value={parent}
                  onChange={e => setParent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                >
                  <option value="">None (Root Level)</option>
                  {availableParents.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">Nests this place inside another.</p>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea 
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of this location..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                />
              </div>
            </div>
          </section>

          {/* Section: Spatial & Identifier Definitions */}
          <section>
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Spatial & Identity Definition</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Location Lat/Long with optional Get Location trigger */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Location (Lat/Long) <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="e.g. 37.7749, -122.4194"
                      value={latLong}
                      onChange={(e) => setLatLong(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={handleGetLocation}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 border border-indigo-100 text-indigo-400 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors shrink-0"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                    Locate Me
                  </button>
                </div>
              </div>

              {/* Autogenerated System Identifier */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  System Identifier
                  <span className="text-[10px] text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Auto-Generated
                  </span>
                </label>
                <input 
                  type="text" 
                  value={systemId}
                  readOnly
                  className="w-full bg-slate-700 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-400 font-mono cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Initial Status</label>
                <select 
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                >
                  <option value="draft">Draft (Hidden)</option>
                  <option value="active">Active (Live)</option>
                </select>
              </div>
            </div>
          </section>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-900 p-6 border-t border-slate-700 flex items-center justify-between">
          <button onClick={handleCancel} type="button" className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-900 transition-colors">
            Cancel
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleSave(false)} 
              type="button" 
              className="px-4 py-2 text-sm font-medium text-indigo-400 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              Save Draft
            </button>
            <button 
              onClick={() => handleSave(false)} 
              type="button" 
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm"
            >
              Create Place
            </button>
            <button 
              onClick={() => handleSave(true)} 
              type="button" 
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save & Configure
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
