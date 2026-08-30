import { create } from 'zustand';

export interface SpatialNode {
  id: string;
  type: 'UI_PANEL' | 'MEDIA' | 'TRIGGER';
  transform: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
  };
  uiPayload?: {
    layout: Record<string, unknown>;
  };
  mediaPayload?: {
    url: string;
    assetType: string;
  };
}

interface BuilderState {
  nodes: SpatialNode[];
  selectedNodeId: string | null;
  addNode: (node: SpatialNode) => void;
  updateNode: (id: string, updates: Partial<SpatialNode>) => void;
  removeNode: (id: string) => void;
  selectNode: (id: string | null) => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  nodes: [],
  selectedNodeId: null,
  
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  
  updateNode: (id, updates) => set((state) => ({
    nodes: state.nodes.map(node => 
      node.id === id ? { ...node, ...updates } : node
    )
  })),
  
  removeNode: (id) => set((state) => ({
    nodes: state.nodes.filter(node => node.id !== id),
    selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId
  })),
  
  selectNode: (id) => set({ selectedNodeId: id }),
}));
