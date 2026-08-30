'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';

export default function CreateExperiencePage() {
  const router = useRouter();
  const [qrId, setQrId] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [targetPlaceId, setTargetPlaceId] = useState('');
  const [description, setDescription] = useState('');
  const [availability, setAvailability] = useState('always');
  const [status, setStatus] = useState('draft');
  
  const [availablePlaces, setAvailablePlaces] = useState<any[]>([]);

  useEffect(() => {
    const randomHex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    setQrId(`qr_exp_${randomHex.toLowerCase()}`);
    
    // Fetch available places
    apiFetch<any[]>('/places').then((data) => {
      if (Array.isArray(data)) setAvailablePlaces(data);
    }).catch(err => console.error('Failed to load places:', err));
  }, []);

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    router.back();
  };

  const handleSave = async (redirect: boolean) => {
    try {
      const newExp = await apiFetch<any>('/experiences', {
        method: 'POST',
        body: JSON.stringify({
          qrId,
          name,
          type,
          placeId: targetPlaceId,
          description,
          schedule: availability,
          status
        })
      });

      if (redirect && newExp?.id) {
        router.push(`/experiences/${newExp.id}`);
      } else {
        router.push('/experiences');
      }
    } catch (err) {
      console.error('Failed to create experience:', err);
      alert('Failed to create experience.');
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Experience</h1>
          <p className="text-slate-400 mt-1 text-sm">Define what visitors see and interact with at a Place.</p>
        </div>
      </div>

      <form className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 space-y-8">
          
          {/* Section: Basic Info */}
          <section>
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Basic Information</h2>
            
            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                  QR / Spatial Identifier
                </h3>
                <p className="text-xs text-indigo-400 mt-1">This unique ID binds the physical QR sticker to this experience.</p>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={qrId}
                  onChange={(e) => setQrId(e.target.value)}
                  className="w-48 bg-slate-800 border border-indigo-200 rounded-md px-3 py-1.5 text-sm font-mono text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button type="button" onClick={() => {
                  const randomHex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
                  setQrId(`qr_exp_${randomHex.toLowerCase()}`);
                }} className="p-1.5 bg-slate-800 border border-indigo-200 rounded-md text-indigo-400 hover:bg-indigo-500/10 transition-colors" title="Regenerate ID">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Notices and Announcements"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Experience Type</label>
                <select 
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                >
                  <option value="">Select type...</option>
                  <option value="Service-Linked">Service Experience</option>
                  <option value="Content-Only">Content-Only</option>
                  <option value="Interactive">Interactive</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Target Place <span className="text-red-500">*</span></label>
                <select 
                  value={targetPlaceId}
                  onChange={e => setTargetPlaceId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none" required
                >
                  <option value="">Assign to a physical place...</option>
                  {availablePlaces.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea 
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the purpose of this experience..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                />
              </div>
            </div>
          </section>

          {/* Section: Availability & Lifecycle */}
          <section>
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Availability & Lifecycle</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Availability Schedule</label>
                <select 
                  value={availability}
                  onChange={e => setAvailability(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                >
                  <option value="always">Always Available</option>
                  <option value="scheduled">Scheduled Timeframe</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Initial Status</label>
                <select 
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
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
              Create Experience
            </button>
            <button 
              onClick={() => handleSave(true)} 
              type="button" 
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Create & Configure
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
