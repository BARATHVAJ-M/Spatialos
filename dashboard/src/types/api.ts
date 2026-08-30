export interface Place {
  id: string;
  organizationId: string;
  parentId?: string;
  name: string;
  qrTargetId: string;
  type?: string; // Mapped from frontend abstraction if needed
  status?: 'Active' | 'Draft' | 'Archived'; // For UI logic
  _count?: {
    experiences: number;
    services?: number;
  };
  children?: Place[];
  location?: string; // Mapped from lat/lng if we add it
  tags?: string[];
  updatedAt?: string;
  version?: string;
  checksum?: string;
  description?: string;
}

export interface Experience {
  id: string;
  organizationId?: string;
  placeId?: string;
  name: string;
  version?: number | string;
  status?: string; // 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  pubStatus?: string; // Frontend computed
  schedule?: string;
  description?: string;
  targetPlaceName?: string;
  targetPlaceId?: string;
  createdAt?: string;
  updatedAt?: string;
  checksum?: string;
  type?: string;
  spatialNodes?: ExperienceNode[];
  serviceInstances?: ServiceInstance[];
  place?: { name: string; id: string; qrTargetId?: string };
  _count?: {
    spatialNodes?: number;
    serviceInstances?: number;
  };
}

export interface ExperienceNode {
  id: string;
  label?: string; // Mapped for UI
  nodeType?: 'MEDIA' | 'UI_PANEL' | 'TRIGGER' | string;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  referenceId?: string; // Links to a Service ID or Content ID
  // Frontend virtual properties for the editor
  type?: string;
  x?: number;
  y?: number;
  z?: number;
  scale?: number;
  visible?: boolean;
  boundEntityId?: string; 
}

export interface ServiceDefinition {
  id: string;
  name: string;
  version: string;
  category: string;
  description: string;
  configurationSchema: Record<string, unknown>;
  capabilities?: string[];
}

export interface ServiceInstance {
  id: string;
  serviceDefinitionId: string;
  spatialNodeId: string;
  name: string;
  status: 'DRAFT' | 'PUBLISHED' | string;
  configuration: Record<string, unknown>;
  serviceDefinition?: {
    name: string;
    version: string;
    configurationSchema: Record<string, unknown>;
  };
}

export interface AttachedContent {
  id: string;
  name: string;
  type: 'Image' | 'Video' | 'Text' | '3D Model' | string;
  size: string;
  url: string;
  status?: string;
}

export interface AuditItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  details: string;
  diff?: { before: unknown; after: unknown };
  type: 'publish' | 'config' | 'node' | 'system' | string;
}
