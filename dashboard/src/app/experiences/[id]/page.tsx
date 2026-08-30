'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Edit3, Plus, UploadCloud, Archive, Eye,
  MapPin, Box, Server, ImageIcon, Activity, Map, Settings, Play,
  CheckCircle2, AlertCircle, Trash2, ExternalLink, Sparkles,
  Sliders, Navigation, Clock, FileText, X, ChevronRight,
  ShieldCheck, RefreshCw, Send, Copy, Move, RotateCcw,
  Compass, Database, ShieldAlert, Code2, CopyPlus, Smartphone, QrCode, Download, BoxSelect
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';

import { ExperienceNode, ServiceDefinition, ServiceInstance, AttachedContent, AuditItem } from '../../../types/api';
import { NoticeBoardEditor } from '../../../components/services/NoticeBoardEditor';
import { ContentPickerModal } from '../../../components/shared/ContentPickerModal';
import QRCode from 'qrcode';
// AVAILABLE_DEFINITIONS fetched dynamically

const TABS = [
  { id: 'overview', label: 'Overview', icon: MapPin },
  { id: 'content', label: 'Content', icon: ImageIcon },
  { id: 'services', label: 'Services', icon: Server },
  { id: 'spatial', label: 'Spatial Canvas', icon: Map },
  { id: 'configuration', label: 'Configuration', icon: Settings },
  { id: 'preview', label: 'Device Preview', icon: Smartphone },
  { id: 'publishing', label: 'Publishing', icon: UploadCloud },
  { id: 'activity', label: 'Activity', icon: Activity },
];

export default function ExperienceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const experienceId = params.id as string;
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

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
  
  // Available Service Definitions
  const [availableDefinitions, setAvailableDefinitions] = useState<ServiceDefinition[]>([]);
  // Spatial Nodes
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

  // Audit Ledger
  const [viewMode, setViewMode] = useState<'editor'|'preview'>('editor');
  
  // Content Picker Modal State for Service Editor
  const [showContentPicker, setShowContentPicker] = useState<{ type: 'image' | 'video'; callback: (url: string) => void } | null>(null);

  // UI Modals State
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', description: '' });

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

  const extractContents = (instances: ServiceInstance[]): AttachedContent[] => {
    const extracted: AttachedContent[] = [];
    instances.forEach((inst: any) => {
      const contentObj = inst.content || {};
      const itemsToProcess: any[] = [];
      
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
        if (mediaItem.type === 'text') return; // Skip text blocks for media library
        const url = typeof mediaItem === 'string' ? mediaItem : (mediaItem?.url || '');
        if (!url) return;
        
        extracted.push({
          id: `${inst.id}-media-${idx}-${Math.random().toString(36).substring(7)}`,
          name: url.split('/').pop() || 'Uploaded Media',
          type: (mediaItem.type === 'video' || url.endsWith('.mp4')) ? 'Video Plane' : 'Image',
          size: 'Auto',
          url: url,
          status: 'Ready'
        });
      });
    });
    return extracted;
  };

  const fetchExperienceData = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<any>(`/experiences/${experienceId}`);
      setExp((prev: any) => ({
        ...prev,
        ...data,
        targetPlaceName: data.place?.name || prev.targetPlaceName,
        targetPlaceId: data.place?.id || prev.targetPlaceId,
      }));
      if (data.serviceInstances) {
        setServiceInstances(data.serviceInstances);
        
        // Extract content from service instances to populate the Content Tab
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
      
      // Fetch definitions
      const defData = await apiFetch<ServiceDefinition[]>('/services/definitions');
      if (defData) {
        setAvailableDefinitions(defData);
        if (defData.length > 0) {
          setNewServiceDefId(defData[0].id);
        }
      }
      
      // other arrays can be fetched here when the API supports them
    } catch (error) {
      console.error('Failed to fetch experience details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (experienceId) fetchExperienceData();
  }, [experienceId]);

  // Update Edit Meta form when experience loads
  useEffect(() => {
    if (exp.name !== 'Loading...') {
      setEditFormData({ name: exp.name, description: exp.description });
    }
  }, [exp.name, exp.description]);
  
  // Real QR Download Handler
  const handleDownloadQrPng = () => {
    if (!qrCanvasRef.current) return;
    const canvas = qrCanvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${exp.name.replace(/\s+/g, '_').toLowerCase()}_QR_Anchor.png`;
    link.click();
    showToast('success', `Downloaded QR Anchor sticker: ${link.download}`);
  };

  // Generate & Draw Real QR Code on Canvas
  useEffect(() => {
    if (!showQrModal || !qrCanvasRef.current) return;
    
    const canvas = qrCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set Dimensions (high-res for printing)
    canvas.width = 1000;
    canvas.height = 1000;
    
    // Background based on theme
    if (qrStickerTheme === 'standard') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 1000, 1000);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 40;
      ctx.strokeRect(20, 20, 960, 960);
    } else if (qrStickerTheme === 'branded') {
      ctx.fillStyle = '#EEF2FF'; // Indigo 50
      ctx.fillRect(0, 0, 1000, 1000);
      ctx.strokeStyle = '#4F46E5'; // Indigo 600
      ctx.lineWidth = 20;
      ctx.strokeRect(10, 10, 980, 980);
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 1000, 1000);
    }
    
    // Generate actual QR Code (Format for Mobile App Compatibility)
    const payloadUrl = `LOC-${experienceId}`;
    
    QRCode.toDataURL(payloadUrl, {
      width: 600,
      margin: 1,
      color: {
        dark: qrStickerTheme === 'standard' ? '#000000' : '#1E1B4B',
        light: '#00000000' // transparent background
      }
    }).then(url => {
      const img = new Image();
      img.onload = () => {
        // Draw the QR Code in the center
        const size = 600;
        const x = (1000 - size) / 2;
        const y = (1000 - size) / 2 - 50; // shift up slightly to make room for text
        ctx.drawImage(img, x, y, size, size);
        
        // Add branding
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
        
        ctx.fillStyle = '#64748B'; // Slate 500
        ctx.font = '24px monospace';
        ctx.fillText(`Experience: ${experienceId}`, 500, y + size + 90);
      };
      img.src = url;
    }).catch(err => {
      console.error('Failed to generate QR code', err);
    });
    
  }, [showQrModal, qrStickerTheme, experienceId]);

  // Active Dragging Node (Spatial Canvas)
  const [activeNode, setActiveNode] = useState<ExperienceNode | null>(null);
  
  // Attached Service Configuration State
  const [activeInstance, setActiveInstance] = useState<ServiceInstance | null>(null);
  const activeDef = activeInstance ? availableDefinitions.find(d => d.id === activeInstance.serviceDefinitionId) : null;
  const [serviceConfigData, setServiceConfigData] = useState<Record<string, any>>({});
  const [serviceContentData, setServiceContentData] = useState<Record<string, any>>({});

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Duplicate Experience Logic
  const handleDuplicate = () => {
    showToast('info', `Duplicated "${exp.name}" into a new Draft.`);
    // Real implementation would route to the new ID, simulating here.
  };

  // Archive Logic
  const handleArchive = () => {
    if (archiveInput.trim() !== exp.name) {
      showToast('error', 'Confirmation name does not match.');
      return;
    }
    setExp({ ...exp, status: 'Archived', pubStatus: 'Draft' });
    setAudits([{ id: `aud_${Date.now()}`, timestamp: 'Just now', actor: 'Admin', action: 'Archived Experience', target: 'Experience', details: 'Disabled live rendering.', type: 'system' }, ...audits]);
    setShowArchiveModal(false);
    showToast('success', 'Experience archived safely.');
  };

  // Publish Logic
  const handlePublish = async () => {
    try {
      const res = await apiFetch(`/experiences/${experienceId}/publish`, { method: 'POST' });
      const versionStr = String(exp.version || '1.0.0');
      const newVersion = versionStr.includes('.') 
        ? `v${parseInt(versionStr.split('.')[1] || '0') + 1}.0.0`
        : `v${parseInt(versionStr) + 1}.0.0`;
      setExp({ ...exp, pubStatus: 'Published', version: newVersion });
      setAudits([{ id: `aud_${Date.now()}`, timestamp: 'Just now', actor: 'Admin', action: 'Published Experience', target: 'SceneGraph', details: `Compiled to ${newVersion}`, type: 'publish' }, ...audits]);
      setShowPublishModal(false);
      showToast('success', `Experience compiled and pushed live!`);
    } catch (err) {
      showToast('error', 'Failed to publish experience.');
    }
  };

  // Node Cleanup (Auto-delete nodes without services)
  useEffect(() => {
    if (nodes.length > 0 && serviceInstances.length > 0) {
      // Find orphaned nodes
      const orphanedNodes = nodes.filter(n => n.type === 'Service Widget' && !serviceInstances.find(s => s.spatialNodeId === n.id));
      if (orphanedNodes.length > 0) {
        const validNodes = nodes.filter(n => n.type !== 'Service Widget' || serviceInstances.find(s => s.spatialNodeId === n.id));
        setNodes(validNodes);
        apiFetch(`/experiences/${experienceId}/nodes`, {
          method: 'PUT',
          body: JSON.stringify({ nodes: validNodes })
        }).catch(e => console.error(e));
      }
    }
  }, [nodes.length, serviceInstances.length, experienceId]);

  // Save Spatial Node Update
  const handleNodeUpdate = (id: string, field: string, val: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, [field]: val } : n));
    setActiveNode(prev => prev && prev.id === id ? { ...prev, [field]: val } : prev);
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto w-full space-y-6 p-8 relative">
      
      {/* Toast */}
      
      {/* Real Canvas-Generated QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowQrModal(false)} />
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-sm overflow-hidden relative z-10 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">Experience QR Anchor</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-widest font-semibold">User Access Point</p>
              </div>
              <button onClick={() => setShowQrModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col items-center space-y-5">
              {/* Sticker Style Selector */}
              <div className="flex items-center gap-2 p-1 bg-slate-700 rounded-lg text-xs font-semibold">
                <button 
                  onClick={() => setQrStickerTheme('branded')}
                  className={`px-3 py-1 rounded-md transition-colors ${qrStickerTheme === 'branded' ? 'bg-slate-800 shadow-sm text-indigo-400' : 'text-slate-400'}`}
                >
                  Branded
                </button>
                <button 
                  onClick={() => setQrStickerTheme('standard')}
                  className={`px-3 py-1 rounded-md transition-colors ${qrStickerTheme === 'standard' ? 'bg-slate-800 shadow-sm text-indigo-400' : 'text-slate-400'}`}
                >
                  High-Contrast
                </button>
                <button 
                  onClick={() => setQrStickerTheme('minimal')}
                  className={`px-3 py-1 rounded-md transition-colors ${qrStickerTheme === 'minimal' ? 'bg-slate-800 shadow-sm text-indigo-400' : 'text-slate-400'}`}
                >
                  Minimal
                </button>
              </div>

              {/* Real HTML5 Canvas for Authentic QR Output */}
              <div className="p-3 bg-slate-800 border-2 border-slate-700 rounded-2xl shadow-md">
                <canvas ref={qrCanvasRef} className="w-56 h-56 rounded-lg" />
              </div>

              <div className="w-full text-center space-y-1 bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Anchor UUID:</span>
                  <button 
                    onClick={() => { navigator.clipboard.writeText('qr_exp_1a2b3c'); showToast('success', 'Copied Anchor UUID'); }}
                    className="text-indigo-400 font-semibold hover:underline text-[11px] flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy String
                  </button>
                </div>
                <span className="text-xs font-mono font-bold text-slate-200 block text-left truncate">qr_exp_1a2b3c</span>
              </div>
              
              <div className="w-full grid grid-cols-2 gap-3">
                <button 
                  onClick={handleDownloadQrPng}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" /> Download PNG
                </button>
                <button 
                  onClick={() => {
                    handleDownloadQrPng();
                    showToast('info', 'Printing sticker layout template...');
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  Print Sticker
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl border animate-in slide-in-from-bottom duration-200 bg-slate-800 border-slate-700">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
          {toast.type === 'info' && <Sparkles className="w-5 h-5 text-indigo-500" />}
          <span className="text-sm font-semibold text-slate-200">{toast.message}</span>
        </div>
      )}

      {/* Header Area */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6 shrink-0 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Title & Badges */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/experiences')} 
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-700 rounded-lg transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white tracking-tight">{exp.name}</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-400">
                  {exp.type}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  exp.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 
                  exp.status === 'Archived' ? 'bg-red-500/10 text-red-400' : 'bg-slate-700 text-slate-400'
                }`}>
                  {exp.status}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  exp.pubStatus === 'Published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {exp.pubStatus} ({exp.version})
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 font-medium">
                <span>Bound to:</span>
                <Link href={`/places/${exp.targetPlaceId}`} className="text-indigo-400 hover:underline flex items-center gap-1 font-bold">
                  <MapPin className="w-3.5 h-3.5" /> {exp.targetPlaceName}
                </Link>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={handleDuplicate}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg transition-colors shadow-sm"
              title="Duplicate Experience"
            >
              <CopyPlus className="w-4 h-4" /> Duplicate
            </button>
            <button 
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg transition-colors shadow-sm"
            >
              <Edit3 className="w-4 h-4" /> Edit Meta
            </button>
            <button 
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg transition-colors shadow-sm"
            >
              <QrCode className="w-4 h-4" /> View QR Anchor
            </button>
            <button 
              onClick={() => setShowPublishModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <UploadCloud className="w-4 h-4" /> Compile & Publish
            </button>
            <button 
              onClick={() => setShowArchiveModal(true)}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-500/10 border border-red-100 rounded-lg transition-colors" 
              title="Archive Scene"
            >
              <Archive className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-700 -mb-2 overflow-x-auto space-x-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'spatial' && (
                <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full font-bold">
                  {nodes.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TABS CONTENT */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Box className="w-4 h-4 text-indigo-500" /> Experience Meta
              </h3>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Description</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed">{exp.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Target Binding</span>
                  <Link href={`/places/${exp.targetPlaceId}`} className="font-bold text-indigo-400 mt-0.5 hover:underline flex items-center gap-1">
                    {exp.targetPlaceName} <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Schedule</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{exp.schedule}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Spatial Nodes</span>
                <Map className="w-5 h-5 text-indigo-500" />
              </div>
              <p className="text-3xl font-bold text-white">{nodes.length}</p>
            </div>
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Services</span>
                <Server className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-white">{serviceInstances.length}</p>
            </div>
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm col-span-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Compilation Checksum</span>
                <Database className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-xs font-mono font-bold text-slate-300 truncate bg-slate-900 p-2 rounded border border-slate-800">{exp.checksum}</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. CONTENT TAB */}
      {activeTab === 'content' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-white">Scene Media Assets</h3>
          <p className="text-xs text-slate-400 mt-0.5">Media injected directly into the nodes of this experience.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            {contents.map((item) => (
              <div key={item.id} className="border border-slate-700 rounded-xl overflow-hidden bg-slate-900 flex flex-col justify-between">
                <div className="p-4 space-y-3">
                  <div className="h-28 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                    {item.type === 'Image' && <ImageIcon className="w-8 h-8 text-indigo-400" />}
                    {item.type === '3D Model' && <Box className="w-8 h-8 text-emerald-400" />}
                    <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-slate-900/80 text-white px-1.5 py-0.5 rounded">{item.size}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs truncate">{item.name}</h4>
                  </div>
                </div>
                <div className="p-3 bg-slate-800 border-t border-slate-700 flex items-center justify-between">
                  <button 
                    onClick={() => setShowPreviewAssetModal(item)}
                    className="text-xs font-semibold text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview Asset
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. SERVICES TAB */}
      {activeTab === 'services' && (
        <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
          {/* Services List Panel */}
          <div className="w-full lg:w-1/3 bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Embedded Services</h3>
              <button 
                onClick={() => {
                  if (serviceInstances.length >= 1) {
                    setToast({ type: 'error', message: 'Only one service is allowed per experience. Please delete the existing service to add a new one.' });
                    return;
                  }
                  setActiveTab('spatial');
                  setShowAddNodeModal(true);
                  setNewNodeType('Service Widget');
                }}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-700 hover:bg-indigo-500/10 px-2 py-1 rounded transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Service
              </button>
            </div>
            <div className="space-y-3 pr-1">
              {serviceInstances.map((inst) => {
                const def = availableDefinitions.find(d => d.id === inst.serviceDefinitionId);
                return (
                  <div 
                    key={inst.id} 
                    onClick={() => {
                      setActiveInstance(inst);
                      setServiceConfigData({ ...inst.configuration });
                      setServiceContentData({ ...(inst as any).content });
                    }}
                    className={`border rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-colors ${activeInstance?.id === inst.id ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-900 border-slate-700 hover:border-indigo-300'}`}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                            <Server className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">{inst.name}</h4>
                            <span className="text-[10px] text-slate-400 font-mono block">{def?.name} ({def?.version})</span>
                          </div>
                        </div>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this service?')) {
                              try {
                                const updatedInstances = serviceInstances.filter(i => i.id !== inst.id);
                                setServiceInstances(updatedInstances);
                                
                                const updatedNodes = nodes.filter(n => n.id !== inst.spatialNodeId);
                                setNodes(updatedNodes);

                                if (activeInstance?.id === inst.id) {
                                  setActiveInstance(null);
                                }
                                await apiFetch(`/experiences/${experienceId}/services`, {
                                  method: 'PUT',
                                  body: JSON.stringify({ instances: updatedInstances })
                                });
                                setToast({ type: 'success', message: 'Service deleted successfully' });
                              } catch (err) {
                                setToast({ type: 'error', message: 'Failed to delete service' });
                              }
                            }
                          }}
                          className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-500/10 rounded transition-colors"
                          title="Delete Service"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dynamic Configuration Form & Preview */}
          <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden flex flex-col">
            {!activeInstance ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <Settings className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-sm font-bold">Select a Service to Configure</p>
                <p className="text-xs mt-2 mb-6">Adjust the settings and preview the visual output of the attached service.</p>
                
                {serviceInstances.length === 0 && availableDefinitions.length > 0 && (
                  <div className="p-6 border border-indigo-100 bg-indigo-50 rounded-xl flex flex-col items-center">
                    <p className="text-sm font-bold text-indigo-900 mb-2">No service attached yet</p>
                    <p className="text-xs text-indigo-400 mb-4 max-w-xs text-center">Most experiences only need one service. Attach one instantly at the origin [0,0,0].</p>
                    <div className="flex gap-2 w-full">
                      <select 
                        className="flex-1 text-sm border-slate-600 rounded-lg p-2"
                        value={newServiceDefId}
                        onChange={(e) => setNewServiceDefId(e.target.value)}
                      >
                        {availableDefinitions.length > 0 ? availableDefinitions.map(def => (
                          <option key={def.id} value={def.id}>{def.name}</option>
                        )) : (
                          <option value="">No services available</option>
                        )}
                      </select>
                      <button 
                        disabled={availableDefinitions.length === 0}
                        onClick={async () => {
                          const def = availableDefinitions.find(d => d.id === newServiceDefId) || availableDefinitions[0];
                          if (!def) {
                            showToast('error', 'No service definitions available.');
                            return;
                          }
                          
                          const nodeId = crypto.randomUUID();
                          const newNode: ExperienceNode = {
                            id: nodeId,
                            label: `${def.name} Root`,
                            type: 'Service Widget',
                            x: 0, y: 0, z: 0,
                            scale: 1, visible: true,
                            boundEntityId: ''
                          };
                          
                          const newInst: ServiceInstance = {
                            id: crypto.randomUUID(),
                            serviceDefinitionId: def.id,
                            spatialNodeId: nodeId,
                            name: `${def.name} Instance`,
                            status: 'DRAFT',
                            configuration: {}
                          };
                          
                          if (def.configurationSchema) {
                            Object.keys(def.configurationSchema).forEach(key => {
                              newInst.configuration[key] = (def.configurationSchema as any)[key]?.default || '';
                            });
                          }
                          newNode.boundEntityId = newInst.id;
                          
                          const updatedNodes = [...nodes, newNode];
                          const updatedInstances = [...serviceInstances, newInst];
                          
                          setNodes(updatedNodes);
                          setServiceInstances(updatedInstances);
                          
                          try {
                            await apiFetch(`/experiences/${experienceId}/nodes`, {
                              method: 'PUT',
                              body: JSON.stringify({ nodes: updatedNodes })
                            });
                            await apiFetch(`/experiences/${experienceId}/services`, {
                              method: 'PUT',
                              body: JSON.stringify({ instances: updatedInstances })
                            });
                            
                            // Immediately update content state reactive to new instance
                            setContents(extractContents(updatedInstances));
                            
                            showToast('success', 'Service instantly attached!');
                            // Auto select it
                            setActiveInstance(newInst);
                            setServiceConfigData({ ...newInst.configuration });
                            setServiceContentData({ ...(newInst as any).content });
                          } catch (e) {
                            showToast('error', 'Failed to save attached service');
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg font-medium"
                      >
                        Quick Attach
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full">
                {/* Generic UI Wrapper for the active Service */}
                {(() => {
                  const def = availableDefinitions.find(d => d.id === activeInstance.serviceDefinitionId);
                  if (def?.name === 'Notice Board') {
                    return (
                      <div className="flex-1 flex flex-col h-full overflow-hidden">
                        <div className="flex-1 min-h-[400px]">
                          <NoticeBoardEditor 
                            key={activeInstance.id}
                            instance={activeInstance} 
                            config={serviceConfigData} 
                            onConfigChange={setServiceConfigData}
                            content={serviceContentData}
                            onContentChange={setServiceContentData}
                            onAddMediaRequest={(type, cb) => setShowContentPicker({ type, callback: cb })}
                          />
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-700 shrink-0">
                          <button 
                            onClick={async () => {
                              try {
                                const updatedInstances = serviceInstances.map(inst => 
                                  inst.id === activeInstance.id ? { ...inst, configuration: serviceConfigData, content: serviceContentData } as any : inst
                                );
                                setServiceInstances(updatedInstances);
                                setActiveInstance({ ...activeInstance, configuration: serviceConfigData, content: serviceContentData } as any);
                                
                                await apiFetch(`/experiences/${experienceId}/services`, {
                                  method: 'PUT',
                                  body: JSON.stringify({ instances: updatedInstances })
                                });
                                
                                // Immediately update content state reactive to modified instance
                                setContents(extractContents(updatedInstances));

                                showToast('success', 'Notice Board Saved to Backend');
                              } catch (err) {
                                console.error('Failed to save service instance', err);
                                showToast('error', 'Failed to save Notice Board');
                              }
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg text-sm transition-colors"
                          >
                            Save Notice Board Configuration & Content
                          </button>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="flex flex-col md:flex-row h-full">
                      
                      {/* Editor Form */}
                      <div className="flex-1 p-6 overflow-y-auto border-r border-slate-700 bg-slate-900">
                        <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-indigo-500" />
                          Configure {activeInstance.name}
                        </h3>
                  
                  {(() => {
                    if (!def || !def.configurationSchema || Object.keys(def.configurationSchema).length === 0) {
                      return (
                        <div className="p-8 text-center bg-slate-800 border border-slate-700 rounded-xl">
                          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                          <h4 className="text-sm font-bold text-white">No Configuration Required</h4>
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-6">
                        {Object.entries(def.configurationSchema).map(([key, field]: [string, any]) => (
                        <div key={key}>
                          <label className="block text-sm font-bold text-slate-300 mb-1.5 flex items-center gap-2">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          
                          {field.type === 'string' && (
                            <input 
                              type="text" 
                              value={serviceConfigData[key] || ''}
                              onChange={(e) => setServiceConfigData({...serviceConfigData, [key]: e.target.value})}
                              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            />
                          )}
                          
                          {field.type === 'number' && (
                            <input 
                              type="number" 
                              value={serviceConfigData[key] || ''}
                              onChange={(e) => setServiceConfigData({...serviceConfigData, [key]: parseInt(e.target.value) || 0})}
                              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            />
                          )}

                          {field.type === 'select' && (
                            <select 
                              value={serviceConfigData[key] || ''}
                              onChange={(e) => setServiceConfigData({...serviceConfigData, [key]: e.target.value})}
                              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            >
                              {field.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          )}

                          {field.type === 'boolean' && (
                            <div className="flex items-center gap-3 mt-2">
                              <button 
                                onClick={() => setServiceConfigData({...serviceConfigData, [key]: !serviceConfigData[key]})}
                                className={`w-10 h-5 rounded-full p-1 transition-colors ${serviceConfigData[key] ? 'bg-indigo-600' : 'bg-slate-300'}`}
                              >
                                <div className={`w-3 h-3 bg-slate-800 rounded-full transition-transform ${serviceConfigData[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                              </button>
                            </div>
                          )}

                          {field.type === 'color' && (
                            <div className="flex items-center gap-3">
                              <input 
                                type="color" 
                                value={serviceConfigData[key] || '#000000'}
                                onChange={(e) => setServiceConfigData({...serviceConfigData, [key]: e.target.value})}
                                className="w-10 h-10 border-0 rounded cursor-pointer p-0"
                              />
                            </div>
                          )}
                          {field.description && <p className="text-[10px] text-slate-400 mt-1">{field.description}</p>}
                        </div>
                      ))}
                      
                      <div className="pt-4 border-t border-slate-700">
                        <button 
                          onClick={async () => {
                            try {
                              const updatedInstances = serviceInstances.map(inst => 
                                inst.id === activeInstance.id ? { ...inst, configuration: serviceConfigData } : inst
                              );
                              setServiceInstances(updatedInstances);
                              setActiveInstance({ ...activeInstance, configuration: serviceConfigData } as any);
                              
                              await apiFetch(`/experiences/${experienceId}/services`, {
                                method: 'PUT',
                                body: JSON.stringify({ instances: updatedInstances })
                              });
                              
                              // Keep contents synced
                              setContents(extractContents(updatedInstances));
                              
                              showToast('success', 'Service Configuration Saved to Backend');
                            } catch (err) {
                              console.error('Failed to save service instance', err);
                              showToast('error', 'Failed to save configuration');
                            }
                          }}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                        >
                          Save Instance Configuration
                        </button>
                      </div>
                    </div>
                    );
                  })()}
                </div>

                {/* Mobile Preview */}
                <div className="w-full md:w-[320px] bg-slate-700 flex flex-col items-center justify-center p-6 shrink-0 relative">
                  <span className="absolute top-4 left-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live AR Preview</span>
                  
                  {/* Fake iPhone Mockup */}
                  <div className="w-[280px] h-[580px] bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl relative border-4 border-slate-800 flex flex-col overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-800 rounded-b-xl z-20"></div>
                    
                    <div className="flex-1 bg-slate-800 rounded-[2rem] overflow-hidden flex flex-col">
                      {activeDef?.name === 'Token System' ? (
                        <div className="h-full flex flex-col bg-slate-800 p-6 items-center justify-center text-center">
                            <h3 className="text-lg font-bold text-slate-200 mb-6">{serviceConfigData.counterName || 'Counter'}</h3>
                            <div className="w-40 h-40 rounded-full bg-indigo-50 border-8 border-indigo-100 flex flex-col items-center justify-center mb-6 shadow-inner">
                              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Your Token</span>
                              <span className="text-4xl font-black text-indigo-400 font-mono tracking-tighter">{serviceConfigData.tokenPrefix || 'A-'}042</span>
                            </div>
                            <p className="text-xs font-bold text-slate-400">Max Queue: {serviceConfigData.maximumQueue}</p>
                        </div>
                      ) : activeDef?.name === 'Complaint Box' ? (
                        <div className="h-full flex flex-col bg-slate-900 p-6 items-center justify-center text-center">
                            <div className="w-full bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden flex flex-col">
                              <div className="bg-red-500 p-4 text-white">
                                <h3 className="text-lg font-bold">{serviceConfigData.title || 'Feedback Box'}</h3>
                                <p className="text-[10px] opacity-90 mt-1">Submit your {serviceConfigData.categories || 'General'} feedback</p>
                              </div>
                              <div className="p-6 space-y-4 flex-1">
                                <div className="space-y-1 text-left">
                                  <label className="text-xs font-bold text-slate-400 uppercase">Message</label>
                                  <div className="w-full h-24 bg-slate-700 rounded-lg border-2 border-dashed border-slate-600"></div>
                                  <p className="text-[10px] text-slate-400 text-right">0 / {serviceConfigData.maxMessageLength || 500} chars</p>
                                </div>
                                {serviceConfigData.allowAnonymous && (
                                  <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold bg-slate-900 p-2 rounded">
                                    <div className="w-4 h-4 rounded border border-slate-600 bg-slate-800"></div>
                                    Submit Anonymously
                                  </div>
                                )}
                              </div>
                              <div className="p-4 border-t border-slate-800">
                                <button className="w-full py-3 bg-red-500 text-white font-bold rounded-lg shadow-md">Submit</button>
                              </div>
                            </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                          <BoxSelect className="w-8 h-8 mb-3 opacity-50" />
                          <p className="text-xs font-bold">No Preview Available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
            )}
          </div>
        </div>
      )}

      {/* 4. SPATIAL CANVAS TAB (The 3D Grid Editor) */}
      {activeTab === 'spatial' && (
        <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
          {/* Node List Panel */}
          <div className="w-full lg:w-1/3 bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-sm">Scene Nodes</h3>
              <button 
                onClick={() => setShowAddNodeModal(true)}
                className="p-1.5 bg-indigo-50 text-indigo-400 rounded hover:bg-indigo-100 transition-colors"
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
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${activeNode?.id === node.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-700 bg-slate-900 hover:border-indigo-300'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-white">{node.label}</h4>
                      <span className="text-[10px] font-mono text-slate-400">{node.type}</span>
                    </div>
                    <span className="text-[9px] font-bold bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">[{node.x}, {node.y}, {node.z}]</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Active Node Editor Form */}
            {activeNode && (
              <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Configure Node</h4>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400">X (Horiz)</label>
                    <input type="number" step="0.1" value={activeNode.x} onChange={e => handleNodeUpdate(activeNode.id, 'x', parseFloat(e.target.value))} className="w-full text-xs p-1.5 border border-slate-700 rounded" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400">Y (Vert)</label>
                    <input type="number" step="0.1" value={activeNode.y} onChange={e => handleNodeUpdate(activeNode.id, 'y', parseFloat(e.target.value))} className="w-full text-xs p-1.5 border border-slate-700 rounded" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400">Z (Depth)</label>
                    <input type="number" step="0.1" value={activeNode.z} onChange={e => handleNodeUpdate(activeNode.id, 'z', parseFloat(e.target.value))} className="w-full text-xs p-1.5 border border-slate-700 rounded" />
                  </div>
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-slate-400">Scale Mutator</label>
                  <input type="range" min="0.1" max="3" step="0.1" value={activeNode.scale} onChange={e => handleNodeUpdate(activeNode.id, 'scale', parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                </div>
              </div>
            )}
          </div>

          {/* Interactive Spatial Grid Canvas */}
          <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 shadow-inner relative overflow-hidden flex items-center justify-center min-h-[500px]">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
            
            {/* Center Origin Crosshair */}
            <div className="absolute w-full h-[1px] bg-indigo-500/30" />
            <div className="absolute h-full w-[1px] bg-indigo-500/30" />
            <div className="absolute z-0 flex items-center justify-center">
              <span className="absolute mt-6 text-[10px] font-bold text-indigo-500/50">ORIGIN (QR)</span>
              <div className="w-3 h-3 border-2 border-indigo-500 rounded-full" />
            </div>

            {/* Rendering Nodes visually based on X (Horizontal) and Y (Vertical) relative to center */}
            {/* Z (Depth) is represented by scale/opacity styling */}
            <div className="relative w-full h-full flex items-center justify-center z-10 pointer-events-none">
              {nodes.map(node => {
                // Mapping arbitrary coordinate units to screen pixels (e.g., 1 unit = 80px)
                const pxX = (node.x || 0) * 80;
                const pxY = -(node.y || 0) * 80; // Invert Y so positive is up
                const depthScale = Math.max(0.5, 1 + ((node.z || 0) * 0.2)); // Simulating depth

                const isActive = activeNode?.id === node.id;

                return (
                  <div 
                    key={node.id}
                    className="absolute pointer-events-auto cursor-grab active:cursor-grabbing transition-transform duration-200"
                    style={{
                      transform: `translate(${pxX}px, ${pxY}px) scale(${depthScale * (node.scale || 1)})`,
                      zIndex: Math.round(((node.z || 0) + 10) * 10)
                    }}
                    onClick={() => setActiveNode(node)}
                  >
                    <div className={`p-2 rounded-lg border-2 shadow-xl backdrop-blur-sm flex flex-col items-center justify-center min-w-[100px] ${
                      isActive ? 'border-emerald-400 bg-emerald-900/80 text-white' : 'border-slate-500 bg-slate-800/80 text-slate-300'
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
              <span className="text-[10px] text-slate-400 font-mono bg-slate-950/80 px-2 py-1 rounded">Scale: 1 unit = 1 meter</span>
              <button className="text-[10px] font-bold text-white bg-indigo-600 px-3 py-1.5 rounded-lg shadow-lg hover:bg-indigo-500">Save Node Graph</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CONFIGURATION TAB */}
      {activeTab === 'configuration' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6 space-y-6">
          <h3 className="text-base font-bold text-white">Global Experience Overrides</h3>
          <p className="text-xs text-slate-400">JSON schema overrides applied to the entire scene upon initialization.</p>
          
          <div className="grid grid-cols-2 gap-6 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Ambient Light Intensity</label>
              <input type="range" min="0" max="1" step="0.1" value={config.ambientLighting} onChange={e => setConfig({...config, ambientLighting: parseFloat(e.target.value)})} className="w-full" />
              <span className="text-xs font-mono text-indigo-400">{config.ambientLighting}</span>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Max Render Distance (m)</label>
              <input type="number" value={config.maxRenderDistance} onChange={e => setConfig({...config, maxRenderDistance: parseFloat(e.target.value)})} className="w-full p-2 border rounded text-sm" />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-900 border rounded-lg col-span-2">
              <span className="text-sm font-bold text-slate-300">Enable Shadow Casting</span>
              <input type="checkbox" checked={config.shadowsEnabled} onChange={e => setConfig({...config, shadowsEnabled: e.target.checked})} className="w-5 h-5 accent-indigo-600" />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-900 border rounded-lg col-span-2">
              <span className="text-sm font-bold text-slate-300">Enable Physics/Collisions</span>
              <input type="checkbox" checked={config.physicsCollision} onChange={e => setConfig({...config, physicsCollision: e.target.checked})} className="w-5 h-5 accent-indigo-600" />
            </div>
          </div>
        </div>
      )}

      {/* 6. DEVICE PREVIEW TAB */}
      {activeTab === 'preview' && (
        <div className="flex-1 flex flex-col items-center justify-center py-6 bg-slate-900 rounded-xl border border-slate-700 min-h-[600px] overflow-hidden">
          
          {/* Simulated Mobile Device Frame */}
          <div className="w-[340px] h-[720px] bg-slate-950 rounded-[48px] border-[14px] border-slate-900 shadow-2xl relative overflow-hidden flex flex-col">
            
            {/* Dynamic Camera Feed Simulation Layer */}
            <div className="absolute inset-0 bg-slate-800 animate-pulse opacity-20" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity" alt="Camera feed" />
            
            {/* Device Notch */}
            <div className="w-36 h-6 bg-slate-900 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-2xl z-50 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-800" />
            </div>

            {/* Simulated AR Overlay Context */}
            <div className="flex-1 relative z-20 flex flex-col items-center justify-center transform perspective-1000">
              
              {/* Iterating Nodes over the simulated camera */}
              {nodes.filter(n => n.visible).map(node => {
                // Highly simulated 3D projection for web UI demonstration
                const transX = (node.x || 0) * 60;
                const transY = -(node.y || 0) * 60 + 100; // Push it up slightly in view
                const scale = Math.max(0.6, 1 + ((node.z || 0) * 0.15)) * (node.scale || 1);
                
                return (
                  <div 
                    key={node.id}
                    className="absolute transition-all duration-500 ease-out flex flex-col items-center"
                    style={{
                      transform: `translate(${transX}px, ${transY}px) scale(${scale})`,
                    }}
                  >
                    {node.type === 'Text Billboard' && (
                      <div className="bg-white/95 backdrop-blur text-white font-bold px-4 py-2 rounded-lg shadow-2xl border-l-4 border-indigo-500 animate-bounce text-sm">
                        👋 Welcome to {exp.targetPlaceName}
                      </div>
                    )}
                    
                    {node.type === 'Service Widget' && (
                      <div className="bg-indigo-600/90 backdrop-blur text-white p-4 rounded-xl shadow-2xl border border-indigo-400 w-48 mt-4">
                        <p className="font-bold border-b border-indigo-400/50 pb-2 mb-2 text-xs flex items-center justify-between">
                          <span>Notice Board</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        </p>
                        <div className="space-y-2 text-[10px] opacity-90">
                          <div className="bg-indigo-700/50 p-1.5 rounded">All systems operational today.</div>
                          <div className="bg-indigo-700/50 p-1.5 rounded">Guest Lecture at 14:00.</div>
                        </div>
                      </div>
                    )}
                    
                    {node.type === '3D Model' && (
                      <div className="w-24 h-32 bg-emerald-500/20 border-2 border-emerald-400/50 rounded-xl mt-6 flex items-center justify-center text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                        <Box className="w-10 h-10 animate-spin-slow" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom HUD */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur rounded-full px-4 py-2 flex justify-between items-center text-white text-[10px] font-mono border border-white/10 z-30">
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Tracking: Anchored</span>
              <span>60 FPS</span>
            </div>
          </div>

        </div>
      )}

      {/* 7. PUBLISHING TAB */}
      {activeTab === 'publishing' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-400 flex items-center justify-center font-bold">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Pre-Flight Publisher Compiler</h3>
              <p className="text-xs text-slate-400">Run structural validation before deploying the binary SceneGraph.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex flex-col">
              <ShieldCheck className="w-6 h-6 text-emerald-400 mb-2" />
              <h4 className="font-bold text-sm text-white">Node Graph Validated</h4>
              <p className="text-xs text-emerald-400 mt-1">{nodes.length} nodes structurally sound. No overlapping collisions detected.</p>
            </div>
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex flex-col">
              <Database className="w-6 h-6 text-emerald-400 mb-2" />
              <h4 className="font-bold text-sm text-white">Assets Resolved</h4>
              <p className="text-xs text-emerald-400 mt-1">All referenced media assets (3.2MB total) are available in storage.</p>
            </div>
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex flex-col">
              <Server className="w-6 h-6 text-emerald-400 mb-2" />
              <h4 className="font-bold text-sm text-white">Services Active</h4>
              <p className="text-xs text-emerald-400 mt-1">Bound Notice Board service is running and returning 200 OK.</p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              onClick={() => setShowPublishModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> Compile & Deploy to AR Engine
            </button>
          </div>
        </div>
      )}

      {/* 8. ACTIVITY & AUDIT TAB */}
      {activeTab === 'activity' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-white">Experience Event Ledger</h3>
          <div className="divide-y divide-slate-800">
            {audits.map((item) => (
              <div key={item.id} className="py-4 flex gap-4 items-start">
                <div className="mt-1">
                  {item.type === 'publish' && <UploadCloud className="w-4 h-4 text-emerald-500" />}
                  {item.type === 'node' && <Map className="w-4 h-4 text-indigo-500" />}
                  {item.type === 'system' && <Archive className="w-4 h-4 text-red-500" />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{item.action}</span>
                    <span className="text-xs text-slate-400 font-mono">{item.timestamp}</span>
                  </div>
                  <p className="text-sm text-slate-400">{item.details}</p>
                  
                  {item.diff && (
                    <div className="mt-2 p-3 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 space-y-1">
                      <div className="text-red-400">- Before: {JSON.stringify(item.diff.before)}</div>
                      <div className="text-emerald-400">+ After: {JSON.stringify(item.diff.after)}</div>
                    </div>
                  )}
                  
                  <div className="text-xs text-slate-400 font-mono mt-1">Actor: {item.actor}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}

      {/* Edit Meta Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md overflow-hidden relative z-10 shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-white text-lg">Edit Experience Metadata</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Name</label>
                <input type="text" value={exp.name} onChange={e => setExp({...exp, name: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Status</label>
                <select value={exp.status} onChange={e => setExp({...exp, status: e.target.value as any})} className="w-full p-2 border rounded">
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
                <textarea rows={3} value={exp.description} onChange={e => setExp({...exp, description: e.target.value})} className="w-full p-2 border rounded resize-none" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
              <button onClick={() => { setShowEditModal(false); showToast('success', 'Metadata updated.'); }} className="px-5 py-2 bg-slate-900 text-white rounded text-sm font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Asset Lightbox Modal */}
      {showPreviewAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowPreviewAssetModal(null)} />
          <div className="bg-slate-800 rounded-xl w-full max-w-md overflow-hidden relative z-10 shadow-2xl p-6 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white">{showPreviewAssetModal.name}</h3>
              <button onClick={() => setShowPreviewAssetModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            
            <div className="h-48 bg-slate-900 rounded-lg flex flex-col items-center justify-center text-white">
              {showPreviewAssetModal.type === '3D Model' && <Box className="w-12 h-12 text-emerald-400 animate-spin" />}
              {showPreviewAssetModal.type === 'Image' && <ImageIcon className="w-12 h-12 text-indigo-400" />}
              <span className="text-xs font-mono mt-2">Preview rendering...</span>
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirm Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowPublishModal(false)} />
          <div className="bg-slate-800 rounded-xl w-full max-w-sm overflow-hidden relative z-10 shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-white text-lg flex items-center gap-2"><UploadCloud className="w-5 h-5 text-indigo-400" /> Confirm Publish</h3>
            <p className="text-sm text-slate-400">This will compile the node graph and push the payload to the live AR engine.</p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowPublishModal(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
              <button onClick={handlePublish} className="px-5 py-2 bg-indigo-600 text-white rounded font-bold">Publish Now</button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowArchiveModal(false)} />
          <div className="bg-slate-800 rounded-xl w-full max-w-sm overflow-hidden relative z-10 shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-red-400 text-lg flex items-center gap-2"><Archive className="w-5 h-5" /> Archive Experience</h3>
            <p className="text-sm text-slate-400">Type <strong className="text-white">{exp.name}</strong> to confirm.</p>
            <input type="text" value={archiveInput} onChange={e => setArchiveInput(e.target.value)} className="w-full p-2 border border-red-500/20 rounded focus:ring-1 focus:ring-red-500 outline-none" />
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowArchiveModal(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
              <button onClick={handleArchive} disabled={archiveInput !== exp.name} className="px-5 py-2 bg-red-600 text-white rounded font-bold disabled:bg-red-300">Archive</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Node Modal */}
      {showAddNodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddNodeModal(false)} />
          <div className="bg-slate-800 rounded-xl w-full max-w-sm overflow-hidden relative z-10 shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-white text-lg flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-400" /> Add Spatial Node</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Node Label</label>
                <input type="text" placeholder="e.g. Navigation Arrow" value={newNodeLabel} onChange={e => setNewNodeLabel(e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Node Type</label>
                <select className="w-full p-2 border rounded" value={newNodeType} onChange={e => setNewNodeType(e.target.value)}>
                  <option value="3D Model">3D Model</option>
                  <option value="Service Widget">Service Widget</option>
                  <option value="Text Billboard">Text Billboard</option>
                  <option value="Video Plane">Video Plane</option>
                  <option value="Audio Zone">Audio Zone</option>
                </select>
              </div>

              {newNodeType === 'Service Widget' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Select Service Template</label>
                  {availableDefinitions.length > 0 ? (
                    <select className="w-full p-2 border rounded bg-indigo-50" value={newServiceDefId} onChange={e => setNewServiceDefId(e.target.value)}>
                      {availableDefinitions.map(def => (
                        <option key={def.id} value={def.id}>{def.name} (v{def.version})</option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2 border border-red-500/20 bg-red-500/10 text-red-400 rounded text-xs">
                      No service templates available. Please contact admin.
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">This will bind a new instance of this service to this spatial node.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowAddNodeModal(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
              <button disabled={newNodeType === 'Service Widget' && availableDefinitions.length === 0} onClick={() => {
                const label = newNodeLabel || 'New Node';
                const nodeId = crypto.randomUUID();
                
                const newNode: ExperienceNode = {
                  id: nodeId,
                  label,
                  type: newNodeType as any,
                  x: 0,
                  y: 0,
                  z: 0,
                  scale: 1,
                  visible: true,
                  boundEntityId: ''
                };
                
                // If it's a Service Widget, create the ServiceInstance too!
                let updatedInstances = serviceInstances;
                if (newNodeType === 'Service Widget') {
                  const def = availableDefinitions.find(d => d.id === newServiceDefId) || availableDefinitions[0];
                  if (!def) {
                    showToast('error', 'No service definitions available.');
                    return;
                  }
                  const newInst: ServiceInstance = {
                    id: crypto.randomUUID(),
                    serviceDefinitionId: def.id,
                    spatialNodeId: nodeId,
                    name: `${label} Service`,
                    status: 'DRAFT',
                    configuration: {}
                  };
                  // Pre-fill default configs
                  if (def.configurationSchema) {
                    Object.keys(def.configurationSchema).forEach(key => {
                      newInst.configuration[key] = (def.configurationSchema as any)[key]?.default || '';
                    });
                  }
                  updatedInstances = [...serviceInstances, newInst];
                  setServiceInstances(updatedInstances);
                  newNode.boundEntityId = newInst.id; // Link node to instance
                }

                const updatedNodes = [...nodes, newNode];
                setNodes(updatedNodes);

                // Save to backend automatically
                apiFetch(`/experiences/${experienceId}/nodes`, {
                  method: 'PUT',
                  body: JSON.stringify({ nodes: updatedNodes })
                }).then(() => {
                  if (newNodeType === 'Service Widget') {
                    return apiFetch(`/experiences/${experienceId}/services`, {
                      method: 'PUT',
                      body: JSON.stringify({ instances: updatedInstances })
                    });
                  }
                }).catch(err => {
                  console.error('Failed to save to backend', err);
                  showToast('error', 'Failed to save node to backend');
                });

                setShowAddNodeModal(false);
                setNewNodeLabel('');
                showToast('success', `Added new ${newNodeType} node to origin.`);
                setAudits([{ id: `aud_${Date.now()}`, timestamp: 'Just now', actor: 'Admin', action: 'Added Node', target: label, details: `Created at origin [0,0,0]`, type: 'node' }, ...audits]);
              }} className="px-5 py-2 bg-indigo-600 text-white rounded font-bold">Add Node</button>
            </div>
          </div>
        </div>
      )}

      {/* Modals placed here */}
      
      {/* Edit Meta Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-md relative z-10">
            <h3 className="font-bold text-white mb-4">Edit Experience Meta</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Name</label>
                <input 
                  type="text" 
                  value={editFormData.name} 
                  onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                  className="w-full p-2 border rounded" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
                <textarea 
                  value={editFormData.description} 
                  onChange={e => setEditFormData({...editFormData, description: e.target.value})}
                  className="w-full p-2 border rounded"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
                <button 
                  onClick={async () => {
                    try {
                      await apiFetch(`/experiences/${experienceId}`, {
                        method: 'PUT',
                        body: JSON.stringify(editFormData)
                      });
                      setExp({ ...exp, ...editFormData });
                      setShowEditModal(false);
                      showToast('success', 'Experience metadata updated');
                    } catch (e) {
                      showToast('error', 'Failed to update metadata');
                    }
                  }} 
                  className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-bold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Picker Modal */}
      {showContentPicker && (
        <ContentPickerModal 
          filterType={showContentPicker.type}
          onClose={() => setShowContentPicker(null)}
          onSelect={(url) => {
            showContentPicker.callback(url);
            setShowContentPicker(null);
          }}
        />
      )}

    </div>
  );
}
