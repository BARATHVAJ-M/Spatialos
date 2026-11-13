'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ExperienceNode, ServiceDefinition, ServiceInstance, AttachedContent, AuditItem } from '../../../../types/api';
import { experiencesService } from '../../../../services/experiences.service';
import { httpClient } from '../../../../core/http/http-client';
import QRCode from 'qrcode';

export function useExperienceEditor() {
  const router = useRouter();
  const params = useParams();
  const experienceId = params.id as string;
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Core Experience State
  const [exp, setExp] = useState<any>({
    id: experienceId,
    name: 'Loading...',
    type: 'Service-Linked',
    status: 'Active',
    pubStatus: 'Draft',
    schedule: 'Always Available (24/7)',
    targetPlaceName: 'Loading...',
    targetPlaceId: '1',
    description: '',
    createdAt: new Date().toISOString(),
    updatedAt: 'Just now',
    version: 'v1.0.0',
    checksum: '',
  });

  // Attached Assets
  const [serviceInstances, setServiceInstances] = useState<ServiceInstance[]>([]);
  const [contents, setContents] = useState<AttachedContent[]>([]);
  const [availableDefinitions, setAvailableDefinitions] = useState<ServiceDefinition[]>([]);
  const [nodes, setNodes] = useState<ExperienceNode[]>([]);

  // Global Experience Configuration JSON
  const [config, setConfig] = useState({
    ambientLighting: 0.8,
    shadowsEnabled: true,
    physicsCollision: false,
    backgroundAudioEnabled: false,
    maxRenderDistance: 10.0,
    themeMode: 'dark',
    customCSS: ''
  });

  // Content Picker Modal State for Service Editor
  const [showContentPicker, setShowContentPicker] = useState<{ type: 'image' | 'video'; callback: (url: string, actualType?: 'image' | 'video') => void } | null>(null);

  // UI Modals State
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '' });

  // Add Node Modal State
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [newNodeType, setNewNodeType] = useState<string>('3D Model');
  const [newServiceDefId, setNewServiceDefId] = useState<string>('def_notice_board');
  const [newNodeLabel, setNewNodeLabel] = useState<string>('');

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveInput, setArchiveInput] = useState('');
  const [showPreviewAssetModal, setShowPreviewAssetModal] = useState<AttachedContent | null>(null);
  
  // QR State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrStickerTheme, setQrStickerTheme] = useState<'branded'|'standard'|'minimal'>('branded');
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [audits, setAudits] = useState<AuditItem[]>([]);

  // Active Dragging Node (Spatial Canvas)
  const [activeNode, setActiveNode] = useState<ExperienceNode | null>(null);
  const [dragState, setDragState] = useState<{ id: string, startX: number, startY: number, initialNodeX: number, initialNodeY: number } | null>(null);

  // Attached Service Configuration State
  const [activeInstance, setActiveInstance] = useState<ServiceInstance | null>(null);
  const activeDef = activeInstance ? availableDefinitions.find(d => d.id === activeInstance.serviceDefinitionId) : null;
  const [serviceConfigData, setServiceConfigData] = useState<Record<string, any>>({});
  const [serviceContentData, setServiceContentData] = useState<Record<string, any>>({});

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const extractContents = useCallback((instances: ServiceInstance[]): AttachedContent[] => {
    const extracted: AttachedContent[] = [];
    instances.forEach((inst: any) => {
      const contentObj = inst.content || {};
      const configObj = inst.configuration || {};
      const itemsToProcess: any[] = [];
      
      // Staff Details Service Media
      if (configObj.photoUrl) {
        itemsToProcess.push({
          url: configObj.photoUrl,
          type: 'image',
          customName: configObj.staffName ? `${configObj.staffName}'s Photo` : 'Staff Photo'
        });
      }
      
      // Legacy check for root mediaItems
      if (Array.isArray(contentObj.mediaItems)) {
        itemsToProcess.push(...contentObj.mediaItems);
      }
        
      // New check for pages
      if (Array.isArray(contentObj.pages)) {
        contentObj.pages.forEach((page: any) => {
          if (Array.isArray(page.mediaItems)) {
            itemsToProcess.push(...page.mediaItems);
          }
        });
      }

      itemsToProcess.forEach((mediaItem: any, idx: number) => {
        if (mediaItem.type === 'text') return;
        const url = typeof mediaItem === 'string' ? mediaItem : (mediaItem?.url || '');
        if (!url) return;
        
        extracted.push({
          id: `${inst.id}-media-${idx}-${Math.random().toString(36).substring(7)}`,
          name: mediaItem.customName || url.split('/').pop() || 'Uploaded Media',
          type: (mediaItem.type === 'video' || url.endsWith('.mp4')) ? 'Video Plane' : 'Image',
          size: 'Auto',
          url: url,
          status: 'Ready'
        });
      });
    });
    return extracted;
  }, []);

  const fetchExperienceData = useCallback(async () => {
    setIsLoading(true);
    const result = await experiencesService.getById(experienceId);
    if (result.ok) {
      const data: any = result.value;
      setExp((prev: any) => ({
        ...prev,
        ...data,
        targetPlaceName: data.place?.name || prev.targetPlaceName,
        targetPlaceId: data.place?.id || prev.targetPlaceId,
      }));
      if (data.serviceInstances) {
        setServiceInstances(data.serviceInstances);
        setContents(extractContents(data.serviceInstances));
      }

      if (data.spatialNodes) {
        const mappedNodes = data.spatialNodes.map((dbNode: any) => ({
          id: dbNode.id,
          label: dbNode.nodeType === 'UI_PANEL' ? 'Service Widget' : 'Media Node',
          type: dbNode.nodeType === 'UI_PANEL' ? 'Service Widget' : '3D Model',
          x: dbNode.positionX || 0,
          y: dbNode.positionY || 0,
          z: dbNode.positionZ || 0,
          scale: dbNode.scaleX || 1,
          visible: true,
          boundEntityId: dbNode.referenceId || ''
        }));
        setNodes(mappedNodes);
      }
    } else {
      showToast('error', result.error.message || 'Failed to fetch experience details');
    }

    // Fetch definitions
    const defRes = await httpClient.get<ServiceDefinition[]>('/services/definitions');
    if (defRes.ok && defRes.value) {
      setAvailableDefinitions(defRes.value);
      if (defRes.value.length > 0) {
        setNewServiceDefId(defRes.value[0].id);
      }
    }

    setIsLoading(false);
  }, [experienceId, extractContents, showToast]);

  useEffect(() => {
    if (experienceId) fetchExperienceData();
  }, [experienceId, fetchExperienceData]);

  // Update Edit Meta form when experience loads
  useEffect(() => {
    if (exp.name !== 'Loading...') {
      setEditFormData({ name: exp.name });
    }
  }, [exp.name, exp.description]);

  // Real QR Download Handler
  const handleDownloadQrPng = useCallback(() => {
    if (!qrCanvasRef.current) return;
    const canvas = qrCanvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${exp.name.replace(/\s+/g, '_').toLowerCase()}_QR_Anchor.png`;
    link.click();
    showToast('success', `Downloaded QR Anchor sticker: ${link.download}`);
  }, [exp.name, showToast]);

  // Generate & Draw Real QR Code on Canvas
  useEffect(() => {
    if (!showQrModal || !qrCanvasRef.current) return;
    
    const canvas = qrCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 1000;
    canvas.height = 1000;
    
    if (qrStickerTheme === 'standard') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 1000, 1000);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 40;
      ctx.strokeRect(20, 20, 960, 960);
    } else if (qrStickerTheme === 'branded') {
      ctx.fillStyle = '#EEF2FF';
      ctx.fillRect(0, 0, 1000, 1000);
      ctx.strokeStyle = '#4F46E5';
      ctx.lineWidth = 20;
      ctx.strokeRect(10, 10, 980, 980);
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 1000, 1000);
    }
    
    const payloadUrl = `LOC-${experienceId}`;
    
    QRCode.toDataURL(payloadUrl, {
      width: 600,
      margin: 1,
      color: {
        dark: qrStickerTheme === 'standard' ? '#000000' : '#1E1B4B',
        light: '#00000000'
      }
    }).then(url => {
      const img = new Image();
      img.onload = () => {
        const size = 600;
        const x = (1000 - size) / 2;
        const y = (1000 - size) / 2 - 50;
        ctx.drawImage(img, x, y, size, size);
        
        if (qrStickerTheme === 'branded') {
          ctx.fillStyle = '#EEF2FF';
          ctx.beginPath();
          ctx.arc(500, y + size / 2, 80, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.fillStyle = qrStickerTheme === 'standard' ? '#000000' : '#4F46E5';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SCAN TO EXPERIENCE', 500, y + size + 40);
        
        ctx.fillStyle = '#64748B';
        ctx.font = '24px monospace';
        ctx.fillText(`Experience: ${experienceId}`, 500, y + size + 90);
      };
      img.src = url;
    }).catch(err => {
      console.error('Failed to generate QR code', err);
    });
  }, [showQrModal, qrStickerTheme, experienceId]);

  const handlePointerDown = useCallback((e: React.PointerEvent, node: ExperienceNode) => {
    e.stopPropagation();
    setActiveNode(node);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragState({
      id: node.id,
      startX: e.clientX,
      startY: e.clientY,
      initialNodeX: node.x || 0,
      initialNodeY: node.y || 0
    });
  }, []);

  const handleNodeUpdate = useCallback((id: string, field: string, val: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, [field]: val } : n));
    setActiveNode(prev => prev && prev.id === id ? { ...prev, [field]: val } : prev);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState) return;
    const deltaX = (e.clientX - dragState.startX) / 80;
    const deltaY = -(e.clientY - dragState.startY) / 80;
    handleNodeUpdate(dragState.id, 'x', Math.round((dragState.initialNodeX + deltaX) * 10) / 10);
    handleNodeUpdate(dragState.id, 'y', Math.round((dragState.initialNodeY + deltaY) * 10) / 10);
  }, [dragState, handleNodeUpdate]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (dragState) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setDragState(null);
    }
  }, [dragState]);

  const handleArchive = useCallback(async () => {
    if (archiveInput.trim() !== exp.name) {
      showToast('error', 'Confirmation name does not match.');
      return;
    }
    setExp((prev: any) => ({ ...prev, status: 'Archived', pubStatus: 'Draft' }));
    setAudits(prev => [{ id: `aud_${Date.now()}`, timestamp: 'Just now', actor: 'Admin', action: 'Archived Experience', target: 'Experience', details: 'Disabled live rendering.', type: 'system' }, ...prev]);
    setShowArchiveModal(false);
    showToast('success', 'Experience archived safely.');
  }, [archiveInput, exp.name, showToast]);

  const handlePublish = useCallback(async () => {
    const result = await experiencesService.publish(experienceId);
    if (result.ok) {
      const versionStr = String(exp.version || '1.0.0');
      const newVersion = versionStr.includes('.') 
        ? `v${parseInt(versionStr.split('.')[1] || '0') + 1}.0.0`
        : `v${parseInt(versionStr) + 1}.0.0`;
      setExp((prev: any) => ({ ...prev, pubStatus: 'Published', version: newVersion }));
      setAudits(prev => [{ id: `aud_${Date.now()}`, timestamp: 'Just now', actor: 'Admin', action: 'Published Experience', target: 'SceneGraph', details: `Compiled to ${newVersion}`, type: 'publish' }, ...prev]);
      setShowPublishModal(false);
      showToast('success', `Experience compiled and pushed live!`);
    } else {
      showToast('error', result.error.message || 'Failed to publish experience.');
    }
  }, [experienceId, exp.version, showToast]);

  const saveNodeGraph = useCallback(async () => {
    const result = await experiencesService.updateNodes(experienceId, nodes);
    if (result.ok) {
      showToast('success', 'Spatial nodes updated securely.');
    } else {
      showToast('error', result.error.message || 'Failed to save spatial nodes.');
    }
  }, [experienceId, nodes, showToast]);

  // Node Cleanup (Auto-delete nodes without services)
  useEffect(() => {
    if (nodes.length > 0 && serviceInstances.length > 0) {
      const orphanedNodes = nodes.filter(n => n.type === 'Service Widget' && !serviceInstances.find(s => s.spatialNodeId === n.id));
      if (orphanedNodes.length > 0) {
        const validNodes = nodes.filter(n => n.type !== 'Service Widget' || serviceInstances.find(s => s.spatialNodeId === n.id));
        setNodes(validNodes);
        experiencesService.updateNodes(experienceId, validNodes).catch(console.error);
      }
    }
  }, [nodes.length, serviceInstances.length, experienceId]);

  return {
    experienceId,
    router,
    activeTab,
    setActiveTab,
    isLoading,
    exp,
    setExp,
    serviceInstances,
    setServiceInstances,
    contents,
    setContents,
    availableDefinitions,
    nodes,
    setNodes,
    config,
    setConfig,
    showContentPicker,
    setShowContentPicker,
    toast,
    showToast,
    showEditModal,
    setShowEditModal,
    editFormData,
    setEditFormData,
    showAddNodeModal,
    setShowAddNodeModal,
    newNodeType,
    setNewNodeType,
    newServiceDefId,
    setNewServiceDefId,
    newNodeLabel,
    setNewNodeLabel,
    showPublishModal,
    setShowPublishModal,
    showArchiveModal,
    setShowArchiveModal,
    archiveInput,
    setArchiveInput,
    showPreviewAssetModal,
    setShowPreviewAssetModal,
    showQrModal,
    setShowQrModal,
    qrStickerTheme,
    setQrStickerTheme,
    qrCanvasRef,
    audits,
    activeNode,
    setActiveNode,
    dragState,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleNodeUpdate,
    activeInstance,
    setActiveInstance,
    activeDef,
    serviceConfigData,
    setServiceConfigData,
    serviceContentData,
    setServiceContentData,
    handleDownloadQrPng,
    handleArchive,
    handlePublish,
    saveNodeGraph,
    extractContents,
  };
}

export type ExperienceEditorContext = ReturnType<typeof useExperienceEditor>;
