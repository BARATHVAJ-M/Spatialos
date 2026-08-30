'use client';

import { useBuilderStore } from '@/store/useBuilderStore';
import { Plus, Play, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function DashboardHeader() {
  const { addNode, nodes } = useBuilderStore();

  const handleAddNode = (type: 'UI_PANEL' | 'MEDIA' | 'TRIGGER') => {
    addNode({
      id: uuidv4(),
      type,
      transform: {
        position: { x: (Math.random() - 0.5) * 400, y: (Math.random() - 0.5) * 400, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      }
    });
  };

  const handleSave = async () => {
    console.log("Saving Scene Graph:", nodes);
    alert('Scene Graph saved! Check console for payload.');
  };

  return (
    <div className="h-16 bg-slate-800 border-b border-slate-700 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-slate-200">Visual Builder</h2>
        <div className="h-6 w-px bg-slate-700" />
        <div className="flex items-center gap-2">
          <button onClick={() => handleAddNode('UI_PANEL')} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-200 text-slate-300 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> UI Panel
          </button>
          <button onClick={() => handleAddNode('MEDIA')} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-200 text-slate-300 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Media
          </button>
          <button onClick={() => handleAddNode('TRIGGER')} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-200 text-slate-300 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Trigger
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2 text-indigo-400 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-sm font-semibold transition-colors">
          <Play className="w-4 h-4" /> Preview
        </button>
        <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95">
          <Save className="w-4 h-4" /> Publish Experience
        </button>
      </div>
    </div>
  );
}
