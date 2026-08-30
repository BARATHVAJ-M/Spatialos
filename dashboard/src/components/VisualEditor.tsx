'use client';

import { useBuilderStore } from '@/store/useBuilderStore';
import { MousePointer2, Type, Image as ImageIcon, BoxSelect } from 'lucide-react';
import { useState } from 'react';

export function VisualEditor() {
  const { nodes, selectedNodeId, selectNode, updateNode } = useBuilderStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    selectNode(id);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedNodeId) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    const node = nodes.find(n => n.id === selectedNodeId);
    if (node) {
      updateNode(selectedNodeId, {
        transform: {
          ...node.transform,
          position: {
            ...node.transform.position,
            x: node.transform.position.x + dx,
            y: node.transform.position.y + dy,
          }
        }
      });
    }

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className="flex-1 bg-slate-700 relative overflow-hidden rounded-2xl border border-slate-700 m-4 shadow-inner"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={(e) => {
        if (e.target === e.currentTarget) selectNode(null);
      }}
    >
      {/* Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #94a3b8 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Canvas Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] border-2 border-dashed border-slate-600 rounded-3xl pointer-events-none flex items-center justify-center">
        <span className="text-slate-400 font-medium">Spatial Origin (0,0,0)</span>
      </div>

      {nodes.map(node => (
        <div
          key={node.id}
          onMouseDown={(e) => handleMouseDown(e, node.id)}
          className={`absolute p-4 rounded-xl cursor-move transition-shadow ${
            selectedNodeId === node.id 
              ? 'ring-4 ring-indigo-500 bg-slate-800 shadow-2xl z-10' 
              : 'bg-slate-800 hover:ring-2 ring-indigo-300 shadow-lg'
          }`}
          style={{
            left: `calc(50% + ${node.transform.position.x}px)`,
            top: `calc(50% + ${node.transform.position.y}px)`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-400">
              {node.type === 'UI_PANEL' && <Type className="w-5 h-5" />}
              {node.type === 'MEDIA' && <ImageIcon className="w-5 h-5" />}
              {node.type === 'TRIGGER' && <BoxSelect className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-semibold text-white">{node.type}</p>
              <p className="text-xs text-slate-400 font-mono">
                {Math.round(node.transform.position.x)}, {Math.round(node.transform.position.y)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
