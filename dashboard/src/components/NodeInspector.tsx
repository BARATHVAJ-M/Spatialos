'use client';

import { useBuilderStore } from '@/store/useBuilderStore';
import { Settings2, Trash2 } from 'lucide-react';

export function NodeInspector() {
  const { nodes, selectedNodeId, updateNode, removeNode } = useBuilderStore();
  
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="w-80 border-l border-slate-700 bg-slate-800 h-full flex items-center justify-center text-slate-400 p-8 text-center shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] z-20">
        <div className="space-y-4">
          <Settings2 className="w-12 h-12 mx-auto opacity-20" />
          <p>Select a node to inspect and edit its properties.</p>
        </div>
      </div>
    );
  }

  const handleChange = (axis: 'x' | 'y' | 'z', value: string) => {
    const numValue = parseFloat(value) || 0;
    updateNode(selectedNode.id, {
      transform: {
        ...selectedNode.transform,
        position: {
          ...selectedNode.transform.position,
          [axis]: numValue
        }
      }
    });
  };

  return (
    <div className="w-80 border-l border-slate-700 bg-slate-800 h-full flex flex-col shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] z-20">
      <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
        <h2 className="font-semibold text-slate-200 flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-indigo-500" />
          Inspector
        </h2>
        <button 
          onClick={() => removeNode(selectedNode.id)}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
          title="Delete Node"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Identity</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Type</label>
              <div className="px-3 py-2 bg-slate-700 rounded-lg text-sm font-medium text-slate-300">
                {selectedNode.type}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">ID</label>
              <div className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-400 truncate">
                {selectedNode.id}
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-700" />

        <div>
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Transform</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-2">Position</label>
              <div className="grid grid-cols-3 gap-2">
                <TransformInput label="X" value={selectedNode.transform.position.x} onChange={(v) => handleChange('x', v)} />
                <TransformInput label="Y" value={selectedNode.transform.position.y} onChange={(v) => handleChange('y', v)} />
                <TransformInput label="Z" value={selectedNode.transform.position.z} onChange={(v) => handleChange('z', v)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransformInput({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">{label}</span>
      <input 
        type="number"
        value={Math.round(value)}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-8 pr-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
      />
    </div>
  );
}
