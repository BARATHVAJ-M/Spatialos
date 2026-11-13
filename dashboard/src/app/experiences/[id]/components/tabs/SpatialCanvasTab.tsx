'use client';

import { Plus, Server, Box, FileText, QrCode } from 'lucide-react';
import { ExperienceEditorContext } from '../../hooks/useExperienceEditor';

interface SpatialCanvasTabProps {
  editor: ExperienceEditorContext;
}

export function SpatialCanvasTab({ editor }: SpatialCanvasTabProps) {
  const {
    nodes,
    activeNode,
    setActiveNode,
    setShowAddNodeModal,
    handleNodeUpdate,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    saveNodeGraph,
  } = editor;

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
      {/* Node List Panel */}
      <div className="w-full lg:w-1/3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Scene Nodes</h3>
          <button 
            onClick={() => setShowAddNodeModal(true)}
            className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 dark:text-indigo-400 rounded hover:bg-indigo-100 transition-colors"
            title="Add Node"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {nodes.map(node => (
            <div 
              key={node.id} 
              onClick={() => setActiveNode(node)}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                activeNode?.id === node.id 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' 
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-indigo-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{node.label}</h4>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{node.type}</span>
                </div>
                <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">
                  [{node.x}, {node.y}, {node.z}]
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Active Node Editor Form */}
        {activeNode && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">Configure Node</h4>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">X (Horiz)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={activeNode.x ?? 0} 
                  onChange={e => handleNodeUpdate(activeNode.id, 'x', parseFloat(e.target.value) || 0)} 
                  className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Y (Vert)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={activeNode.y ?? 0} 
                  onChange={e => handleNodeUpdate(activeNode.id, 'y', parseFloat(e.target.value) || 0)} 
                  className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Z (Depth)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={activeNode.z ?? 0} 
                  onChange={e => handleNodeUpdate(activeNode.id, 'z', parseFloat(e.target.value) || 0)} 
                  className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white" 
                />
              </div>
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Scale Mutator</label>
              <input 
                type="range" 
                min="0.1" 
                max="3" 
                step="0.1" 
                value={activeNode.scale ?? 1} 
                onChange={e => handleNodeUpdate(activeNode.id, 'scale', parseFloat(e.target.value) || 1)} 
                className="w-full accent-indigo-500" 
              />
            </div>
          </div>
        )}
      </div>

      {/* Interactive Spatial Grid Canvas */}
      <div 
        className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner relative overflow-hidden flex items-center justify-center min-h-[500px] select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
        
        {/* Center Origin Crosshair */}
        <div className="absolute w-full h-[1px] bg-indigo-500/30" />
        <div className="absolute h-full w-[1px] bg-indigo-500/30" />
        <div className="absolute z-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 flex flex-col items-center justify-center rounded p-1 opacity-90 shadow-[0_0_20px_rgba(79,70,229,0.3)] border border-slate-200 dark:border-slate-700">
            <QrCode className="w-10 h-10 text-slate-900 dark:text-white" />
            <span className="text-[7px] font-bold text-slate-900 dark:text-white mt-1">ORIGIN</span>
          </div>
        </div>

        {/* Rendering Nodes visually */}
        <div className="relative w-full h-full z-10 pointer-events-none">
          {nodes.map(node => {
            const pxX = (node.x || 0) * 80;
            const pxY = -(node.y || 0) * 80;
            const depthScale = Math.max(0.5, 1 + ((node.z || 0) * 0.2));
            const isActive = activeNode?.id === node.id;

            return (
              <div 
                key={node.id}
                onPointerDown={(e) => handlePointerDown(e, node)}
                className="absolute pointer-events-auto cursor-grab active:cursor-grabbing top-1/2 left-1/2"
                style={{
                  transform: `translate(calc(-50% + ${pxX}px), calc(-50% + ${pxY}px)) scale(${depthScale * (node.scale || 1)})`,
                  zIndex: Math.round(((node.z || 0) + 10) * 10)
                }}
              >
                <div className={`p-2 rounded-lg border-2 shadow-xl backdrop-blur-sm flex flex-col items-center justify-center min-w-[100px] ${
                  isActive ? 'border-emerald-400 bg-emerald-900/80 text-white shadow-[0_0_15px_rgba(52,211,153,0.4)]' : 'border-slate-500 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                }`}>
                  {node.type === 'Service Widget' && <Server className="w-5 h-5 mb-1" />}
                  {node.type === '3D Model' && <Box className="w-5 h-5 mb-1" />}
                  {node.type === 'Text Billboard' && <FileText className="w-5 h-5 mb-1" />}
                  <span className="text-[10px] font-bold truncate max-w-full text-center leading-tight">{node.label}</span>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-950/80 px-2 py-1 rounded">Scale: 1 unit = 1 meter</span>
          <button onClick={saveNodeGraph} className="text-xs font-bold text-white bg-indigo-600 px-3 py-1.5 rounded-lg shadow-lg hover:bg-indigo-500 transition-colors">
            Save Node Graph
          </button>
        </div>
      </div>
    </div>
  );
}
