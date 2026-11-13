'use client';

import { X, UploadCloud, Archive, Plus, Box, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { ExperienceEditorContext } from '../../hooks/useExperienceEditor';
import { ContentPickerModal } from '../../../../../components/shared/ContentPickerModal';
import { BASE_URL } from '../../../../../core/http/http-client';
import { experiencesService } from '../../../../../services/experiences.service';
import { ExperienceNode, ServiceInstance } from '../../../../../types/api';

interface ExperienceEditorModalsProps {
  editor: ExperienceEditorContext;
}

export function ExperienceEditorModals({ editor }: ExperienceEditorModalsProps) {
  const {
    experienceId,
    exp,
    setExp,
    showToast,
    toast,
    showEditModal,
    setShowEditModal,
    editFormData,
    setEditFormData,
    showAddNodeModal,
    setShowAddNodeModal,
    newNodeLabel,
    setNewNodeLabel,
    newNodeType,
    setNewNodeType,
    newServiceDefId,
    setNewServiceDefId,
    availableDefinitions,
    serviceInstances,
    setServiceInstances,
    nodes,
    setNodes,
    showPublishModal,
    setShowPublishModal,
    handlePublish,
    showArchiveModal,
    setShowArchiveModal,
    archiveInput,
    setArchiveInput,
    handleArchive,
    showPreviewAssetModal,
    setShowPreviewAssetModal,
    showContentPicker,
    setShowContentPicker,
  } = editor;

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl border animate-in slide-in-from-bottom duration-200 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
          {toast.type === 'info' && <Sparkles className="w-5 h-5 text-indigo-500" />}
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{toast.message}</span>
        </div>
      )}

      {/* Edit Meta Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-md relative z-10 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Edit Experience Meta</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input 
                  type="text" 
                  value={editFormData.name} 
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" 
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">Cancel</button>
                <button 
                  onClick={async () => {
                    const res = await experiencesService.update(experienceId, editFormData);
                    if (res.ok) {
                      setExp((prev: any) => ({ ...prev, ...editFormData }));
                      setShowEditModal(false);
                      showToast('success', 'Experience metadata updated');
                    } else {
                      showToast('error', res.error.message || 'Failed to update metadata');
                    }
                  }} 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Spatial Node Modal */}
      {showAddNodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddNodeModal(false)} />
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-sm overflow-hidden relative z-10 shadow-2xl p-6 space-y-4 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-500" /> Add Spatial Node
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Node Label</label>
                <input 
                  type="text" 
                  placeholder="e.g. Navigation Arrow" 
                  value={newNodeLabel} 
                  onChange={e => setNewNodeLabel(e.target.value)} 
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Node Type</label>
                <select 
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm" 
                  value={newNodeType} 
                  onChange={e => setNewNodeType(e.target.value)}
                >
                  <option value="3D Model">3D Model</option>
                  <option value="Service Widget">Service Widget</option>
                  <option value="Text Billboard">Text Billboard</option>
                  <option value="Video Plane">Video Plane</option>
                  <option value="Audio Zone">Audio Zone</option>
                </select>
              </div>

              {newNodeType === 'Service Widget' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Service Template</label>
                  {availableDefinitions.length > 0 ? (
                    <select 
                      className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm" 
                      value={newServiceDefId} 
                      onChange={e => setNewServiceDefId(e.target.value)}
                    >
                      {availableDefinitions.map(def => (
                        <option key={def.id} value={def.id}>{def.name} (v{def.version})</option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2 border border-red-500/20 bg-red-500/10 text-red-400 rounded text-xs">
                      No service templates available.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowAddNodeModal(false)} className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">Cancel</button>
              <button 
                disabled={newNodeType === 'Service Widget' && availableDefinitions.length === 0} 
                onClick={async () => {
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
                    if (def.configurationSchema) {
                      Object.keys(def.configurationSchema).forEach(key => {
                        newInst.configuration[key] = (def.configurationSchema as any)[key]?.default || '';
                      });
                    }
                    updatedInstances = [...serviceInstances, newInst];
                    setServiceInstances(updatedInstances);
                    newNode.boundEntityId = newInst.id;
                  }

                  const updatedNodes = [...nodes, newNode];
                  setNodes(updatedNodes);

                  if (newNodeType === 'Service Widget') {
                    await experiencesService.updateServiceInstances(experienceId, updatedInstances);
                  }
                  await experiencesService.updateNodes(experienceId, updatedNodes);

                  setShowAddNodeModal(false);
                  setNewNodeLabel('');
                  showToast('success', `Added new ${newNodeType} node to origin.`);
                }} 
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm"
              >
                Add Node
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirm Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowPublishModal(false)} />
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-sm overflow-hidden relative z-10 shadow-2xl p-6 space-y-4 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-500" /> Confirm Publish
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">This will compile the node graph and push the payload to the live AR engine.</p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowPublishModal(false)} className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">Cancel</button>
              <button onClick={handlePublish} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm">Publish Now</button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowArchiveModal(false)} />
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-sm overflow-hidden relative z-10 shadow-2xl p-6 space-y-4 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-red-500 text-lg flex items-center gap-2">
              <Archive className="w-5 h-5" /> Archive Experience
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Type <strong className="text-slate-900 dark:text-white">{exp.name}</strong> to confirm.</p>
            <input 
              type="text" 
              value={archiveInput} 
              onChange={e => setArchiveInput(e.target.value)} 
              className="w-full p-2 border border-red-500/30 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-red-500/50" 
            />
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowArchiveModal(false)} className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">Cancel</button>
              <button onClick={handleArchive} disabled={archiveInput !== exp.name} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm disabled:opacity-50">Archive</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Asset Modal */}
      {showPreviewAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowPreviewAssetModal(null)} />
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md overflow-hidden relative z-10 shadow-2xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white">{showPreviewAssetModal.name}</h3>
              <button onClick={() => setShowPreviewAssetModal(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
            
            <div className="h-64 bg-slate-50 dark:bg-slate-900 rounded-lg flex flex-col items-center justify-center text-slate-900 dark:text-white overflow-hidden relative">
              {showPreviewAssetModal.type === 'Image' ? (
                <img 
                  src={showPreviewAssetModal.url.startsWith('http') ? showPreviewAssetModal.url : `${BASE_URL}${showPreviewAssetModal.url}`} 
                  alt={showPreviewAssetModal.name} 
                  className="w-full h-full object-contain" 
                />
              ) : showPreviewAssetModal.type === 'Video Plane' || showPreviewAssetModal.type === 'Video' ? (
                <video 
                  src={showPreviewAssetModal.url.startsWith('http') ? showPreviewAssetModal.url : `${BASE_URL}${showPreviewAssetModal.url}`} 
                  controls 
                  className="w-full h-full object-contain" 
                />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <Box className="w-12 h-12 text-emerald-400 animate-spin" />
                  <span className="text-xs font-mono mt-2">Preview rendering...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Picker Modal */}
      {showContentPicker && (
        <ContentPickerModal 
          filterType={showContentPicker.type}
          onClose={() => setShowContentPicker(null)}
          onSelect={(url, type) => {
            showContentPicker.callback(url, type);
            setShowContentPicker(null);
          }}
        />
      )}
    </>
  );
}
