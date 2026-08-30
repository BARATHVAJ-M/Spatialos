'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Edit3, Plus, UploadCloud, Archive, 
  MapPin, Box, Server, ImageIcon, Activity, Map, Download, X,
  CheckCircle2, AlertCircle, Trash2, Eye, ExternalLink, Settings, Sparkles,
  Sliders, Navigation, Layers, Clock, FileText, ToggleLeft, ToggleRight,
  ShieldCheck, RefreshCw, Send, Radio, ChevronRight, Check, Copy,
  Play, Pause, Volume2, Move, RotateCcw, Compass, Database, ShieldAlert,
  Code2, Share2, HelpCircle, FileCheck, CheckSquare, Zap, Terminal, Search
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../../lib/api';

import { Place, Experience, ServiceInstance, AttachedContent, AuditItem } from '../../../types/api';

// For UI convenience
type ExperienceItem = Partial<Experience> & { id: string; name: string; isPrimary?: boolean; priorityOrder?: number; nodesCount?: number; lastUpdated?: string };
type ServiceItem = Partial<ServiceInstance> & { id: string; name: string; type?: string; version?: string; pubStatus?: string; lastUpdated?: string; config?: Record<string, any> };
type ContentItem = Partial<AttachedContent> & { id: string; name: string; spatialTag?: string; attachedTo?: string; addedAt?: string };

const TABS = [
  { id: 'overview', label: 'Overview', icon: MapPin },
  { id: 'experiences', label: 'Experiences', icon: Box },
  { id: 'services', label: 'Services', icon: Server },
  { id: 'content', label: 'Content', icon: ImageIcon },
  { id: 'spatial', label: 'Spatial Config', icon: Map },
  { id: 'activity', label: 'Activity & Audit', icon: Activity },
];

export default function PlaceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const placeId = params.id as string;
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Place Primary Entity State
  const [place, setPlace] = useState<any>({
    id: placeId,
    name: 'Loading...',
    type: 'Location',
    parent: '-',
    status: 'Active',
    systemId: 'PLC-MAIN-01',
    description: '',
    location: '0, 0',
    altitude: 0,
    gpsAccuracy: 0,
    dimensions: '0x0x0',
    floorLevel: '-',
    buildingZone: '-',
    wheelchairAccessible: true,
    audioGuidance: true,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: 'Just now',
    version: 'v1.0.0',
    pubStatus: 'Published',
    checksum: ''
  });

  // Experiences State
  const [experiences, setExperiences] = useState<ExperienceItem[]>([
    { id: 'exp_1', name: 'Main Lobby Notice Board', type: 'Service-Linked', status: 'Active', pubStatus: 'Published', isPrimary: true, priorityOrder: 1, nodesCount: 4, schedule: 'Always Available (24/7)', lastUpdated: '2 hours ago' },
    { id: 'exp_2', name: 'Interactive Wayfinding Guide', type: 'Interactive', status: 'Active', pubStatus: 'Published', isPrimary: false, priorityOrder: 2, nodesCount: 8, schedule: 'Always Available (24/7)', lastUpdated: '1 day ago' },
    { id: 'exp_3', name: 'Seasonal Greetings Banner', type: 'Content-Only', status: 'Draft', pubStatus: 'Draft', isPrimary: false, priorityOrder: 3, nodesCount: 2, schedule: '08:00 AM - 08:00 PM', lastUpdated: '3 days ago' },
  ]);

  // Services State
  const [services, setServices] = useState<ServiceItem[]>([]);

  // Content Assets State
  const [contents, setContents] = useState<ContentItem[]>([]);

  // Spatial Calibration & Anchor Matrix State
  const [spatialConfig, setSpatialConfig] = useState({
    anchorType: 'LiDAR Point Cloud Mesh',
    eyeLevelOffset: 1.50,
    scanMinDistance: 0.5,
    scanMaxDistance: 5.0,
    forwardAxis: '+Z (Forward Normal to Wall)',
    enableOcclusion: true,
    enableMeshCollision: true,
    lightingEstimation: true,
    spatialAudioRadius: 8.0,
    offsetX: 0.0,
    offsetY: 0.0,
    offsetZ: -0.5,
    rotationYaw: 0,
    rotationPitch: 0,
    rotationRoll: 0,
    globalScale: 1.0,
  });

  // Audit Logs State
  const [audits, setAudits] = useState<AuditItem[]>([]);

  // Modal / Drawer Active States
  const [showEditPlaceModal, setShowEditPlaceModal] = useState(false);
  const [showAddExpModal, setShowAddExpModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showConfigureServiceModal, setShowConfigureServiceModal] = useState<ServiceItem | null>(null);
  const [showServiceTestModal, setShowServiceTestModal] = useState<ServiceItem | null>(null);
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [showPreviewAssetModal, setShowPreviewAssetModal] = useState<ContentItem | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveInput, setArchiveInput] = useState('');
  const [selectedAuditDiff, setSelectedAuditDiff] = useState<AuditItem | null>(null);
  const [auditFilter, setAuditFilter] = useState<'all' | 'publish' | 'config' | 'attach' | 'security'>('all');

  // Search & Filtering inside Tabs
  const [expSearch, setExpSearch] = useState('');
  const [srvSearch, setSrvSearch] = useState('');
  const [cntSearch, setCntSearch] = useState('');
  const [contentViewMode, setContentViewMode] = useState<'grid' | 'table'>('grid');

  // Toast Feedback State
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPlace = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<any>(`/places/${placeId}`);
      setPlace((prev: any) => ({
        ...prev,
        ...data,
        name: data.name || prev.name,
        systemId: data.qrTargetId || data.id,
        status: data.status || 'Active',
      }));
      if (data.experiences) {
        setExperiences(data.experiences.map((exp: any) => ({
          id: exp.id,
          name: exp.name || 'Unnamed Experience',
          type: 'Mixed',
          status: exp.status || 'Active',
          pubStatus: 'Published',
          isPrimary: true,
          priorityOrder: 1,
          nodesCount: 0,
          schedule: 'Always Available (24/7)',
          lastUpdated: exp.updatedAt || 'Recently'
        })));
      }
    } catch (error: any) {
      showToast('error', error.message || 'Failed to load place');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (placeId) fetchPlace();
  }, [placeId]);

  // Copy String Helper
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast('info', `Copied ${label} to clipboard: ${text}`);
  };

  // Export JSON Calibration Matrix File
  const handleExportSpatialMatrix = () => {
    const data = {
      placeId: place.systemId,
      placeName: place.name,
      anchorId: place.systemId,
      calibration: spatialConfig,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `spatial_calibration_${place.systemId.toLowerCase()}.json`;
    link.click();
    showToast('success', 'Exported spatial calibration matrix (.JSON)');
  };

  // Export Full Audit Log (.JSON)
  const handleExportAuditJson = () => {
    const blob = new Blob([JSON.stringify(audits, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_log_${place.systemId.toLowerCase()}.json`;
    link.click();
    showToast('success', 'Downloaded complete place audit ledger (.JSON)');
  };

  // Pre-flight Live Publishing
  const handlePublishConfirm = () => {
    setShowPublishModal(false);
    const newVersion = `v2.${parseInt(place.version.split('.')[1] || '4') + 1}.0`;
    setPlace((prev: any) => ({ 
      ...prev, 
      pubStatus: 'Published', 
      updatedAt: 'Just now', 
      version: newVersion,
      checksum: `sha256-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    }));
    
    // Append Audit Entry
    const newAudit: AuditItem = {
      id: `aud_${Date.now()}`,
      timestamp: 'Just now',
      actor: 'Sarah Connor (Super Admin)',
      action: 'Published Place Payload',
      target: `Place [${place.name}]`,
      details: `Validated all dependencies and compiled binary SceneGraph ${newVersion} to live AR Engine.`,
      diff: { before: { version: place.version, pubStatus: place.pubStatus }, after: { version: newVersion, pubStatus: 'Published' } },
      type: 'publish'
    };
    setAudits([newAudit, ...audits]);
    showToast('success', `Place "${place.name}" (${newVersion}) compiled and published to live AR Engine!`);
  };

  // Archive Confirm
  const handleArchivePlace = () => {
    if (archiveInput.trim() !== place.name) {
      showToast('error', 'Confirmation name does not match.');
      return;
    }
    setShowArchiveModal(false);
    setPlace((prev: any) => ({ ...prev, status: 'Archived', pubStatus: 'Draft' }));
    
    const newAudit: AuditItem = {
      id: `aud_${Date.now()}`,
      timestamp: 'Just now',
      actor: 'Sarah Connor (Super Admin)',
      action: 'Archived Place',
      target: `Place [${place.name}]`,
      details: `Place marked as Archived. Physical AR anchor binding disabled.`,
      type: 'security'
    };
    setAudits([newAudit, ...audits]);
    showToast('success', `Place "${place.name}" has been archived.`);
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto w-full relative space-y-6 p-8">
      
      {/* Toast Notification Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl border animate-in slide-in-from-bottom duration-200 bg-slate-800 border-slate-700">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          ) : (
            <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
          )}
          <span className="text-sm font-semibold text-slate-200">{toast.message}</span>
        </div>
      )}

      {/* Header Area */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6 shrink-0 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Place Title & Badges */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/places')} 
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-700 rounded-lg transition-colors shrink-0"
              title="Back to Places Control Plane"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white tracking-tight">{place.name}</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-700 text-slate-300">
                  {place.type}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  place.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 
                  place.status === 'Draft' ? 'bg-amber-500/10 text-amber-400' : 
                  place.status === 'Maintenance' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {place.status}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-400">
                  {place.pubStatus} ({place.version})
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400 font-mono">
                <span>System ID: <strong className="text-slate-300">{place.systemId}</strong></span>
                <span>•</span>
                <span>Floor: <strong className="text-slate-300">{place.floorLevel}</strong></span>
              </div>
            </div>
          </div>
          
          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => setShowEditPlaceModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg transition-colors shadow-sm"
            >
              <Edit3 className="w-4 h-4" /> Edit Place
            </button>
            <button 
              onClick={() => setShowAddExpModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Experience
            </button>
            <button 
              onClick={() => setShowAddServiceModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Service
            </button>
            <button 
              onClick={() => setShowPublishModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <UploadCloud className="w-4 h-4" /> Publish Place
            </button>
            <button 
              onClick={() => setShowArchiveModal(true)}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-500/10 border border-red-100 rounded-lg transition-colors" 
              title="Archive Place"
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
              {tab.id === 'experiences' && (
                <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full font-bold">
                  {experiences.length}
                </span>
              )}
              {tab.id === 'services' && (
                <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full font-bold">
                  {services.length}
                </span>
              )}
              {tab.id === 'content' && (
                <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full font-bold">
                  {contents.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div 
              onClick={() => setActiveTab('experiences')} 
              className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm hover:border-indigo-300 cursor-pointer transition-all"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Experiences</span>
                <Box className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-white mt-2">{experiences.length}</p>
              <span className="text-xs text-indigo-400 font-semibold mt-1 inline-flex items-center gap-1">
                View scenes <ChevronRight className="w-3 h-3" />
              </span>
            </div>

            <div 
              onClick={() => setActiveTab('services')} 
              className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm hover:border-indigo-300 cursor-pointer transition-all"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bound Services</span>
                <Server className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-white mt-2">{services.length}</p>
              <span className="text-xs text-indigo-400 font-semibold mt-1 inline-flex items-center gap-1">
                Manage instances <ChevronRight className="w-3 h-3" />
              </span>
            </div>

            <div 
              onClick={() => setActiveTab('content')} 
              className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm hover:border-indigo-300 cursor-pointer transition-all"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Linked Assets</span>
                <ImageIcon className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-white mt-2">{contents.length}</p>
              <span className="text-xs text-indigo-400 font-semibold mt-1 inline-flex items-center gap-1">
                Media library <ChevronRight className="w-3 h-3" />
              </span>
            </div>

            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scan Health</span>
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-400 mt-2">100% Ready</p>
              <span className="text-xs text-slate-400 mt-1 block font-mono">Anchor & Payloads verified</span>
            </div>
          </div>

          {/* Detailed Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Information Card */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  Physical Place Profile
                </h3>
                <button 
                  onClick={() => setShowEditPlaceModal(true)} 
                  className="text-xs font-semibold text-indigo-400 hover:underline"
                >
                  Edit Profile
                </button>
              </div>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Description</span>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">{place.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Parent Hierarchy</span>
                    <p className="font-semibold text-slate-200 mt-0.5">{place.parent}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Floor Level</span>
                    <p className="font-semibold text-slate-200 mt-0.5">{place.floorLevel}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Room Dimensions</span>
                    <p className="font-semibold text-slate-200 mt-0.5">{place.dimensions}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Building Zone Code</span>
                    <p className="font-semibold font-mono text-slate-200 mt-0.5">{place.buildingZone}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Place Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {place.tags.map((t: any) => (
                      <span key={t} className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs font-medium rounded-md">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Spatial Anchor & GPS Card */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Map className="w-4 h-4 text-indigo-500" />
                  Spatial Anchor & Geolocation
                </h3>
                <button 
                  onClick={() => setActiveTab('spatial')} 
                  className="text-xs font-semibold text-indigo-400 hover:underline"
                >
                  Configure Matrix
                </button>
              </div>

              <div className="space-y-3 text-sm">

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">GPS Coordinates</span>
                    <span className="font-mono text-slate-200 font-semibold">{place.location}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Altitude (MSL)</span>
                    <span className="font-mono text-slate-200 font-semibold">{place.altitude} meters</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Anchor Mechanism</span>
                    <span className="font-semibold text-slate-200">{spatialConfig.anchorType}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Depth Occlusion</span>
                    <span className="font-semibold text-emerald-400">Enabled (LiDAR Depth Mesh)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>SceneGraph Checksum:</span>
                  <span className="font-mono text-[10px] text-slate-400 truncate max-w-[200px]" title={place.checksum}>
                    {place.checksum}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: EXPERIENCES */}
      {activeTab === 'experiences' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">AR Experiences Assigned to {place.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Defines the 3D scene graphs and interactive layouts rendered when visitors scan this location.</p>
            </div>
            <button 
              onClick={() => setShowAddExpModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Create & Assign Experience
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search assigned experiences..."
                value={expSearch}
                onChange={(e) => setExpSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-700 text-xs uppercase font-semibold text-slate-400 tracking-wider">
                  <th className="p-3.5">Experience Name</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Boot Mode</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Publish Status</th>
                  <th className="p-3.5 text-right">3D Nodes</th>
                  <th className="p-3.5">Schedule</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {experiences
                  .filter(e => e.name.toLowerCase().includes(expSearch.toLowerCase()))
                  .map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-semibold text-white">
                      <div className="flex items-center gap-2.5">
                        <Box className="w-4 h-4 text-indigo-500 shrink-0" />
                        <Link href={`/experiences/1`} className="hover:text-indigo-600 transition-colors">
                          {exp.name}
                        </Link>
                      </div>
                    </td>
                    <td className="p-3.5 text-xs text-slate-400 font-medium">{exp.type}</td>
                    <td className="p-3.5">
                      {exp.isPrimary ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                          <Check className="w-3 h-3" /> Primary Default Scene
                        </span>
                      ) : (
                        <button 
                          onClick={() => {
                            setExperiences(prev => prev.map(e => ({ ...e, isPrimary: e.id === exp.id })));
                            showToast('success', `Set "${exp.name}" as the primary default scene for ${place.name}.`);
                          }}
                          className="text-[11px] font-semibold text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          Set as Default
                        </button>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        exp.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {exp.status}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        exp.pubStatus === 'Published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {exp.pubStatus}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono text-xs text-slate-400">{exp.nodesCount} anchors</td>
                    <td className="p-3.5 text-xs text-slate-400">{exp.schedule}</td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link 
                          href="/experiences/1"
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-400 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
                        >
                          Open Scene Editor
                        </Link>
                        <button 
                          onClick={() => {
                            setExperiences(prev => prev.filter(e => e.id !== exp.id));
                            showToast('success', `Unlinked "${exp.name}" from ${place.name}.`);
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          title="Detach from Place"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SERVICES */}
      {activeTab === 'services' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Active Service Capabilities</h3>
              <p className="text-xs text-slate-400 mt-0.5">Plug-and-play functional services attached and executed at {place.name}.</p>
            </div>
            <button 
              onClick={() => setShowAddServiceModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Attach New Service
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {services.map((srv) => (
              <div key={srv.id} className="border border-slate-700 rounded-xl p-5 bg-slate-900 flex flex-col justify-between hover:border-indigo-200 transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-400 flex items-center justify-center font-bold">
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{srv.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono block">{srv.type} ({srv.version})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      srv.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {srv.status}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      srv.pubStatus === 'Published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {srv.pubStatus}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 bg-slate-800 p-3 rounded-lg border border-slate-150 space-y-1 font-mono text-[11px]">
                    {Object.entries(srv.config || {}).map(([key, val]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-slate-400 capitalize">{key}:</span>
                        <span className="font-bold text-slate-300 truncate max-w-[140px]">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-700 flex items-center justify-between">
                  <button 
                    onClick={() => {
                      setServices(prev => prev.map(s => s.id === srv.id ? { ...s, status: s.status === 'Active' ? 'Disabled' : 'Active' } : s));
                      showToast('success', `Toggled "${srv.name}" status.`);
                    }}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-900"
                  >
                    {srv.status === 'Active' ? 'Disable' : 'Enable'}
                  </button>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowServiceTestModal(srv)}
                      className="p-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 font-semibold rounded text-xs transition-colors"
                      title="Test Service Payload"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setShowConfigureServiceModal(srv)}
                      className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-indigo-400 font-semibold rounded text-xs transition-colors flex items-center gap-1"
                    >
                      <Settings className="w-3.5 h-3.5" /> Configure
                    </button>
                    <button 
                      onClick={() => {
                        setServices(prev => prev.filter(s => s.id !== srv.id));
                        showToast('success', `Unlinked "${srv.name}" from ${place.name}.`);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Detach"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CONTENT */}
      {activeTab === 'content' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Media & Asset Library for {place.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Images, videos, text announcements, and 3D objects assigned to this location.</p>
            </div>
            <button 
              onClick={() => setShowAddContentModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Link Content Asset
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            {contents.map((item) => (
              <div key={item.id} className="border border-slate-700 rounded-xl overflow-hidden bg-slate-900 flex flex-col justify-between group hover:border-indigo-300 transition-all">
                <div className="p-4 space-y-3">
                  <div className="h-28 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                    {item.type === 'Image' && <ImageIcon className="w-8 h-8 text-indigo-400" />}
                    {item.type === 'Video' && <Play className="w-8 h-8 text-purple-400" />}
                    {item.type === 'Text' && <FileText className="w-8 h-8 text-amber-400" />}
                    {item.type === '3D Model' && <Box className="w-8 h-8 text-emerald-400" />}
                    <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-slate-900/80 text-white px-1.5 py-0.5 rounded">
                      {item.size}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs truncate" title={item.name}>{item.name}</h4>
                    <span className="text-[10px] text-indigo-400 font-semibold block mt-0.5">📍 {item.spatialTag}</span>
                    <span className="text-[10px] text-slate-400 block">Bound: {item.attachedTo}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-800 border-t border-slate-700 flex items-center justify-between">
                  <button 
                    onClick={() => setShowPreviewAssetModal(item)}
                    className="text-xs font-semibold text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                  <button 
                    onClick={() => {
                      setContents(prev => prev.filter(c => c.id !== item.id));
                      showToast('success', `Removed "${item.name}" from ${place.name}.`);
                    }}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1"
                    title="Remove asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SPATIAL CONFIG */}
      {activeTab === 'spatial' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Spatial AR Calibration & Anchoring Matrix</h3>
              <p className="text-xs text-slate-400 mt-0.5">Configure the physical marker dimension, scan distance triggers, and 3D offset matrices.</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExportSpatialMatrix}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export Matrix (.JSON)
              </button>
              <button 
                onClick={() => showToast('success', 'Spatial AR calibration matrix saved successfully.')}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold text-xs transition-colors shadow-sm"
              >
                Save Calibration
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Calibration Form */}
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Physical Anchor Mechanism</label>
                <select 
                  value={spatialConfig.anchorType}
                  onChange={(e) => setSpatialConfig({ ...spatialConfig, anchorType: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="ARKit / ARCore Cloud Visual Mesh">ARKit / ARCore Cloud Visual Mesh</option>
                  <option value="Bluetooth Low Energy (BLE) Beacon">Bluetooth Low Energy (BLE) Beacon</option>
                  <option value="GPS High-Precision Geofence">GPS High-Precision Geofence Polygon</option>
                  <option value="NFC Physical Contact Anchor">NFC Physical Contact Anchor</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Marker Physical Size</label>
                  <input 
                    type="text"
                    onChange={(e) => setSpatialConfig({ ...spatialConfig, eyeLevelOffset: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Min Scan Trigger (m)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={spatialConfig.scanMinDistance}
                    onChange={(e) => setSpatialConfig({ ...spatialConfig, scanMinDistance: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Max Scan Distance (m)</label>
                  <input 
                    type="number" 
                    step="0.5"
                    value={spatialConfig.scanMaxDistance}
                    onChange={(e) => setSpatialConfig({ ...spatialConfig, scanMaxDistance: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-150">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Real-World Depth Occlusion</span>
                    <span className="text-[11px] text-slate-400">Hides AR objects behind real walls and walking pedestrians.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={spatialConfig.enableOcclusion}
                    onChange={(e) => setSpatialConfig({ ...spatialConfig, enableOcclusion: e.target.checked })}
                    className="w-4 h-4 text-indigo-400 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-150">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">LiDAR / Depth Mesh Collision</span>
                    <span className="text-[11px] text-slate-400">Enables interactive touch placement on physical surfaces.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={spatialConfig.enableMeshCollision}
                    onChange={(e) => setSpatialConfig({ ...spatialConfig, enableMeshCollision: e.target.checked })}
                    className="w-4 h-4 text-indigo-400 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Coordinate Offset Matrix Visualizer */}
            <div className="flex flex-col justify-between bg-slate-900 text-white rounded-xl p-6 border border-slate-800">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Transformation Gizmo Matrix</span>
                  <span className="text-[10px] font-mono text-slate-400">Right (+X), Up (+Y), Depth (+Z)</span>
                </div>

                {/* 3D Coordinate sliders */}
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>X Offset (Horizontal):</span>
                      <span className="text-indigo-400 font-bold">{spatialConfig.offsetX} m</span>
                    </div>
                    <input 
                      type="range" min="-5" max="5" step="0.1" 
                      value={spatialConfig.offsetX}
                      onChange={(e) => setSpatialConfig({ ...spatialConfig, offsetX: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Y Offset (Elevation):</span>
                      <span className="text-indigo-400 font-bold">{spatialConfig.offsetY} m</span>
                    </div>
                    <input 
                      type="range" min="-5" max="5" step="0.1" 
                      value={spatialConfig.offsetY}
                      onChange={(e) => setSpatialConfig({ ...spatialConfig, offsetY: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Z Offset (Depth distance):</span>
                      <span className="text-indigo-400 font-bold">{spatialConfig.offsetZ} m</span>
                    </div>
                    <input 
                      type="range" min="-5" max="5" step="0.1" 
                      value={spatialConfig.offsetZ}
                      onChange={(e) => setSpatialConfig({ ...spatialConfig, offsetZ: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Yaw Rotation:</span>
                      <span className="text-indigo-400 font-bold">{spatialConfig.rotationYaw}°</span>
                    </div>
                    <input 
                      type="range" min="0" max="360" step="5" 
                      value={spatialConfig.rotationYaw}
                      onChange={(e) => setSpatialConfig({ ...spatialConfig, rotationYaw: parseInt(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>

                {/* Real-time Wireframe Visualizer Grid */}
                <div className="mt-4 h-32 bg-slate-950 rounded-lg border border-slate-800 relative flex items-center justify-center text-slate-400 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
                  
                  {/* Visual Coordinate Box with rotation */}
                  <div 
                    className="relative z-10 border border-indigo-500/60 bg-indigo-500/10 px-4 py-2 rounded text-center transition-transform"
                    style={{
                      transform: `translate(${spatialConfig.offsetX * 10}px, ${-spatialConfig.offsetY * 10}px) rotate(${spatialConfig.rotationYaw}deg)`
                    }}
                  >
                    <span className="text-[10px] text-indigo-400 font-bold block">ANCHOR PROJECTION</span>
                    <span className="text-[9px] text-slate-400 font-mono">({spatialConfig.offsetX}, {spatialConfig.offsetY}, {spatialConfig.offsetZ})</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                <button 
                  onClick={() => setSpatialConfig({ ...spatialConfig, offsetX: 0, offsetY: 0, offsetZ: -0.5, rotationYaw: 0 })}
                  className="text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Defaults
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 6: ACTIVITY & AUDIT */}
      {activeTab === 'activity' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Audit Trail & Change History for {place.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Chronological ledger of mutations, configurations, and publishes.</p>
            </div>
            <button 
              onClick={handleExportAuditJson}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export Audit Log (.JSON)
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            {['all', 'publish', 'config', 'attach', 'security'].map((f) => (
              <button
                key={f}
                onClick={() => setAuditFilter(f as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${
                  auditFilter === f 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="divide-y divide-slate-800">
            {audits
              .filter(a => auditFilter === 'all' || a.type === auditFilter)
              .map((item) => (
              <div key={item.id} className="py-4 flex gap-4 items-start hover:bg-slate-700 p-2 rounded-lg transition-colors">
                <div className="mt-1">
                  {item.type === 'publish' && <UploadCloud className="w-4 h-4 text-emerald-500" />}
                  {item.type === 'config' && <Settings className="w-4 h-4 text-indigo-500" />}
                  {item.type === 'attach' && <Plus className="w-4 h-4 text-purple-500" />}
                  {item.type === 'security' && <ShieldAlert className="w-4 h-4 text-red-500" />}
                  {item.type === 'system' && <CheckCircle2 className="w-4 h-4 text-slate-400" />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{item.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-400">{item.details}</p>
                  
                  {/* Accordion Diff View */}
                  {item.diff && (
                    <div className="mt-2 p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-[11px] font-mono text-slate-300 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Payload Mutation Diff:</span>
                      <div className="text-red-400">- Before: {JSON.stringify(item.diff.before)}</div>
                      <div className="text-emerald-400">+ After: {JSON.stringify(item.diff.after)}</div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5 font-mono">
                    <span>Actor: <strong className="text-slate-400">{item.actor}</strong></span>
                    <span>•</span>
                    <span>Target: <strong className="text-slate-400">{item.target}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

{/* GLOBAL MODALS */}

      {/* 2. Edit Place Modal (Complete with Geolocation, Indoor mapping, and tags) */}
      {showEditPlaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowEditPlaceModal(false)} />
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg overflow-hidden relative z-10 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-white text-lg">Edit Place Details & Configuration</h3>
              <button onClick={() => setShowEditPlaceModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setShowEditPlaceModal(false); showToast('success', 'Place details updated successfully.'); }} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Place Display Name *</label>
                <input 
                  type="text" 
                  value={place.name}
                  onChange={(e) => setPlace({ ...place, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Place Type</label>
                  <select 
                    value={place.type}
                    onChange={(e) => setPlace({ ...place, type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="Entrance">Entrance</option>
                    <option value="Building">Building</option>
                    <option value="Department">Department</option>
                    <option value="Room">Room</option>
                    <option value="Floor">Floor</option>
                    <option value="Wayfinding Hub">Wayfinding Hub</option>
                    <option value="Outdoor Zone">Outdoor Zone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Status</label>
                  <select 
                    value={place.status}
                    onChange={(e) => setPlace({ ...place, status: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">GPS Coordinates (Lat, Long)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={place.location}
                    onChange={(e) => setPlace({ ...place, location: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm font-mono text-white focus:outline-none"
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition((pos) => {
                          setPlace((prev: any) => ({ ...prev, location: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` }));
                          showToast('success', 'Detected GPS location successfully.');
                        });
                      }
                    }}
                    className="px-3 py-2 bg-indigo-50 border border-indigo-100 text-indigo-400 rounded-lg text-xs font-semibold shrink-0 hover:bg-indigo-100"
                  >
                    Locate GPS
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Floor Level</label>
                  <input 
                    type="text" 
                    value={place.floorLevel}
                    onChange={(e) => setPlace({ ...place, floorLevel: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Room Dimensions</label>
                  <input 
                    type="text" 
                    value={place.dimensions}
                    onChange={(e) => setPlace({ ...place, dimensions: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Description & Accessibility</label>
                <textarea 
                  rows={3}
                  value={place.description}
                  onChange={(e) => setPlace({ ...place, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowEditPlaceModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Experience Modal */}
      {showAddExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddExpModal(false)} />
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md overflow-hidden relative z-10 shadow-2xl animate-in zoom-in-95 duration-150 p-6 space-y-4">
            <h3 className="font-bold text-white text-lg">Create & Assign Experience</h3>
            <p className="text-xs text-slate-400">Initialize a new spatial scene graph specifically bound to {place.name}.</p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Experience Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Visitor Interactive Billboard"
                  id="new_exp_name"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Experience Type</label>
                <select id="new_exp_type" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none">
                  <option value="Mixed">Mixed (Content & Services)</option>
                  <option value="Service-Linked">Service-Linked</option>
                  <option value="Content-Only">Content-Only</option>
                  <option value="Interactive">Interactive</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Availability Schedule</label>
                <select id="new_exp_schedule" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none">
                  <option value="Always Available (24/7)">Always Available (24/7)</option>
                  <option value="Business Hours (08:00 AM - 06:00 PM)">Business Hours (08:00 AM - 06:00 PM)</option>
                  <option value="Custom Scheduled Timeframe">Custom Scheduled Timeframe</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button onClick={() => setShowAddExpModal(false)} className="px-4 py-2 text-sm font-medium text-slate-400">Cancel</button>
              <button 
                onClick={() => {
                  const input = (document.getElementById('new_exp_name') as HTMLInputElement)?.value;
                  const type = (document.getElementById('new_exp_type') as HTMLSelectElement)?.value as any;
                  const schedule = (document.getElementById('new_exp_schedule') as HTMLSelectElement)?.value;
                  if (!input) return;
                  const newExp: ExperienceItem = {
                    id: `exp_${Date.now()}`,
                    name: input,
                    type: type || 'Mixed',
                    status: 'Active',
                    pubStatus: 'Draft',
                    isPrimary: experiences.length === 0,
                    priorityOrder: experiences.length + 1,
                    nodesCount: 1,
                    schedule: schedule || 'Always Available (24/7)',
                    lastUpdated: 'Just now'
                  };
                  setExperiences([...experiences, newExp]);
                  setShowAddExpModal(false);
                  showToast('success', `Assigned "${input}" to ${place.name}.`);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                Create Experience
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Add Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddServiceModal(false)} />
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg overflow-hidden relative z-10 shadow-2xl animate-in zoom-in-95 duration-150 p-6 space-y-4">
            <h3 className="font-bold text-white text-lg">Attach Service Plugin</h3>
            <p className="text-xs text-slate-400">Choose a developer-registered capability to deploy at {place.name}.</p>
            
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {[
                { name: 'Notice Board', desc: 'Displays announcement feeds and public notifications.', type: 'Notice Board', version: 'v1.2.0' },
                { name: 'Complaint Box', desc: 'Accepts structured feedback and user complaints.', type: 'Complaint Box', version: 'v1.0.4' },
                { name: 'Token Queue System', desc: 'Real-time queue number issuance and tracking.', type: 'Token System', version: 'v0.9.0' },
                { name: 'AI Voice Receptionist', desc: 'Autonomous LLM agent contextualized for this place.', type: 'AI Assistant', version: 'v2.1.0' },
                { name: 'Wayfinding Router', desc: 'Step-by-step turn-by-turn indoor route calculator.', type: 'Wayfinding Router', version: 'v1.1.0' },
                { name: 'Digital Catalog', desc: 'Interactive visual product and service showcase.', type: 'Digital Catalog', version: 'v1.0.0' },
              ].map((plugin) => (
                <div 
                  key={plugin.name}
                  onClick={() => {
                    const newSrv: ServiceItem = {
                      id: `srv_${Date.now()}`,
                      name: `${place.name} ${plugin.name}`,
                      type: plugin.type as any,
                      version: plugin.version,
                      status: 'Active',
                      pubStatus: 'Draft',
                      config: { enabled: true, title: `${place.name} ${plugin.name}`, refreshRate: 30 },
                      lastUpdated: 'Just now'
                    };
                    setServices([...services, newSrv]);
                    setShowAddServiceModal(false);
                    showToast('success', `Attached ${plugin.name} instance to ${place.name}.`);
                  }}
                  className="p-3.5 border border-slate-700 rounded-lg bg-slate-900 hover:bg-indigo-50/40 hover:border-indigo-200 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-white text-sm">{plugin.name}</h4>
                    <p className="text-xs text-slate-400">{plugin.desc}</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded">
                    {plugin.version}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button onClick={() => setShowAddServiceModal(false)} className="px-4 py-2 text-sm font-medium text-slate-400">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Configure Service Dynamic Drawer */}
      {showConfigureServiceModal && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowConfigureServiceModal(null)} />
          <div className="relative w-full max-w-md bg-slate-800 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Service Instance Settings</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{showConfigureServiceModal.name}</h3>
              </div>
              <button onClick={() => setShowConfigureServiceModal(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Instance Display Title</label>
                <input 
                  type="text" 
                  defaultValue={showConfigureServiceModal.name}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Refresh Rate (seconds)</label>
                <input 
                  type="number" 
                  defaultValue={showConfigureServiceModal.config?.refreshRate || 30}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Accent Theme Color</label>
                <input 
                  type="color" 
                  defaultValue={showConfigureServiceModal.config?.accentColor || '#4f46e5'}
                  className="w-12 h-10 border border-slate-700 rounded cursor-pointer"
                />
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-150 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Enable Live Socket Synchronization</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-400 rounded" />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button onClick={() => setShowConfigureServiceModal(null)} className="px-4 py-2 text-sm font-medium text-slate-400">Cancel</button>
              <button 
                onClick={() => {
                  setShowConfigureServiceModal(null);
                  showToast('success', 'Service configuration updated.');
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Service Payload Simulator & Live Test Dialog */}
      {showServiceTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowServiceTestModal(null)} />
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg overflow-hidden relative z-10 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">Service Payload Simulator</h3>
              </div>
              <button onClick={() => setShowServiceTestModal(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-slate-400">Live JSON response returned when the AR client queries this service instance:</p>

            <div className="p-3 bg-slate-950 text-emerald-400 rounded-lg font-mono text-[11px] overflow-x-auto max-h-64">
              <pre>{JSON.stringify({
                serviceId: showServiceTestModal.id,
                serviceName: showServiceTestModal.name,
                type: showServiceTestModal.type,
                version: showServiceTestModal.version,
                placeBinding: place.systemId,
                status: showServiceTestModal.status,
                runtimePayload: {
                  timestamp: new Date().toISOString(),
                  configOverrides: showServiceTestModal.config,
                  liveSocketEndpoint: `wss://api.spatialos.internal/v1/services/${showServiceTestModal.id}/stream`,
                  status: 'OK (200)'
                }
              }, null, 2)}</pre>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => {
                  handleCopyText(JSON.stringify(showServiceTestModal.config), 'Service Payload JSON');
                }}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-200 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" /> Copy JSON
              </button>
              <button 
                onClick={() => setShowServiceTestModal(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Close Simulator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Link Content Modal */}
      {showAddContentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddContentModal(false)} />
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md overflow-hidden relative z-10 shadow-2xl animate-in zoom-in-95 duration-150 p-6 space-y-4">
            <h3 className="font-bold text-white text-lg">Link Media Asset to {place.name}</h3>
            <p className="text-xs text-slate-400">Pick an uploaded media file from the library and specify its spatial placement tag.</p>
            
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {[
                { name: 'evacuation_map_hq.png', type: 'Image', size: '4.1 MB', tag: 'Eye-Level Billboard' },
                { name: 'cafeteria_menu_today.txt', type: 'Text', size: '8 KB', tag: 'Ceiling Banner' },
                { name: 'doctor_schedule_video.mp4', type: 'Video', size: '24.2 MB', tag: 'Floating Kiosk' },
                { name: 'hospital_3d_exterior.glb', type: '3D Model', size: '15.6 MB', tag: 'Floor Marker' },
              ].map((item) => (
                <div 
                  key={item.name}
                  onClick={() => {
                    const newCnt: ContentItem = {
                      id: `cnt_${Date.now()}`,
                      name: item.name,
                      type: item.type as any,
                      size: item.size,
                      url: `/assets/${item.name}`,
                      spatialTag: item.tag as any,
                      attachedTo: 'Direct Place Banner',
                      addedAt: 'Just now'
                    };
                    setContents([...contents, newCnt]);
                    setShowAddContentModal(false);
                    showToast('success', `Linked "${item.name}" to ${place.name}.`);
                  }}
                  className="p-3 border border-slate-700 rounded-lg bg-slate-900 hover:bg-indigo-500/10 hover:border-indigo-200 cursor-pointer transition-all flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-200 block">{item.name}</span>
                    <span className="text-[10px] text-indigo-400 font-medium">📍 {item.tag}</span>
                  </div>
                  <span className="text-slate-400 font-mono">{item.size}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button onClick={() => setShowAddContentModal(false)} className="px-4 py-2 text-sm font-medium text-slate-400">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Preview Asset Lightbox Modal */}
      {showPreviewAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowPreviewAssetModal(null)} />
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg overflow-hidden relative z-10 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm">{showPreviewAssetModal.name}</h3>
                <span className="text-[10px] text-slate-400 font-mono">{showPreviewAssetModal.type} • {showPreviewAssetModal.size} • 📍 {showPreviewAssetModal.spatialTag}</span>
              </div>
              <button onClick={() => setShowPreviewAssetModal(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="h-56 bg-slate-900 rounded-lg flex flex-col items-center justify-center border border-slate-800 text-white p-4 relative overflow-hidden">
              {showPreviewAssetModal.type === 'Image' && (
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="w-12 h-12 text-indigo-400" />
                  <span className="text-xs font-mono text-slate-300">[Interactive Image Stream Loaded]</span>
                </div>
              )}
              {showPreviewAssetModal.type === 'Video' && (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-purple-600/80 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                    <Play className="w-6 h-6 text-white ml-0.5" />
                  </div>
                  <span className="text-xs font-mono text-slate-300">HD AR Video Asset (1080p, 60fps)</span>
                </div>
              )}
              {showPreviewAssetModal.type === '3D Model' && (
                <div className="flex flex-col items-center gap-2">
                  <Box className="w-12 h-12 text-emerald-400 animate-spin" />
                  <span className="text-xs font-mono text-slate-300">glTF / GLB Mesh Preview (48.2k polygons)</span>
                </div>
              )}
              {showPreviewAssetModal.type === 'Text' && (
                <div className="text-left w-full h-full font-mono text-xs text-slate-300 overflow-y-auto">
                  <p>=== SPATIAL NOTICE ANNOUNCEMENT ===</p>
                  <p>Welcome to {place.name}. Please follow health and safety guidelines.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => {
                  const blob = new Blob([`Asset Payload: ${showPreviewAssetModal.name}`], { type: 'application/octet-stream' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = showPreviewAssetModal.name;
                  link.click();
                  showToast('success', `Downloaded asset: ${showPreviewAssetModal.name}`);
                  setShowPreviewAssetModal(null);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Download Asset File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Pre-flight Live Publishing Pipeline Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowPublishModal(false)} />
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md overflow-hidden relative z-10 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-400 flex items-center justify-center font-bold">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Publish {place.name}?</h3>
                <p className="text-xs text-slate-400">Pre-flight compiler validation & production push.</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-150 rounded-lg p-3.5 space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> {experiences.length} Experiences scene graph verified.
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> {services.length} Service capabilities schema verified.
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Spatial calibration bounds: ({spatialConfig.offsetX}, {spatialConfig.offsetY}, {spatialConfig.offsetZ})
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end gap-3">
              <button onClick={() => setShowPublishModal(false)} className="px-4 py-2 text-sm font-medium text-slate-400">Cancel</button>
              <button 
                onClick={handlePublishConfirm}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Confirm & Compile Live
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Safety Archive Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowArchiveModal(false)} />
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md overflow-hidden relative z-10 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-400">
              <Archive className="w-6 h-6" />
              <h3 className="font-bold text-white text-base">Archive {place.name}?</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Archiving this place will immediately disable all user-facing AR scans at <strong className="text-white">{place.name}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Type <span className="font-mono text-red-400 font-bold">{place.name}</span> to confirm:
              </label>
              <input 
                type="text"
                placeholder={place.name}
                value={archiveInput}
                onChange={(e) => setArchiveInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end gap-3">
              <button onClick={() => setShowArchiveModal(false)} className="px-4 py-2 text-sm font-medium text-slate-400">Cancel</button>
              <button 
                onClick={handleArchivePlace}
                disabled={archiveInput.trim() !== place.name}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:bg-red-200 disabled:cursor-not-allowed shadow-sm"
              >
                Confirm Archive
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
