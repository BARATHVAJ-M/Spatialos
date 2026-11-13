'use client';

import { Plus, Server, Trash2, Settings, Edit3, AlertCircle, BoxSelect } from 'lucide-react';
import { NoticeBoardEditor } from '@/components/services/NoticeBoardEditor';
import { ClassroomEditor } from '@/components/services/ClassroomEditor';
import { ComplaintBoxEditor } from '@/components/services/ComplaintBoxEditor';
import { StaffDetailsEditor } from '@/components/services/StaffDetailsEditor';
import { ExperienceEditorContext } from '../../hooks/useExperienceEditor';
import { experiencesService } from '../../../../../services/experiences.service';
import { ExperienceNode, ServiceInstance } from '../../../../../types/api';

interface ServicesTabProps {
  editor: ExperienceEditorContext;
}

export function ServicesTab({ editor }: ServicesTabProps) {
  const {
    experienceId,
    serviceInstances,
    setServiceInstances,
    availableDefinitions,
    nodes,
    setNodes,
    activeInstance,
    setActiveInstance,
    activeDef,
    serviceConfigData,
    setServiceConfigData,
    serviceContentData,
    setServiceContentData,
    newServiceDefId,
    setNewServiceDefId,
    setActiveTab,
    setShowAddNodeModal,
    setNewNodeType,
    setShowContentPicker,
    showToast,
    setContents,
    extractContents,
  } = editor;

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
      {/* Services List Panel */}
      <div className="w-full lg:w-1/3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Embedded Services</h3>
          <button 
            onClick={() => {
              if (serviceInstances.length >= 1) {
                showToast('error', 'Only one service is allowed per experience. Please delete the existing service to add a new one.');
                return;
              }
              setActiveTab('spatial');
              setShowAddNodeModal(true);
              setNewNodeType('Service Widget');
            }}
            className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-500/10 px-2 py-1 rounded transition-colors flex items-center gap-1"
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
                className={`border rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-colors ${
                  activeInstance?.id === inst.id 
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700' 
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{inst.name}</h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">{def?.name} ({def?.version})</span>
                      </div>
                    </div>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this service?')) {
                          const updatedInstances = serviceInstances.filter(i => i.id !== inst.id);
                          setServiceInstances(updatedInstances);
                          
                          const updatedNodes = nodes.filter(n => n.id !== inst.spatialNodeId);
                          setNodes(updatedNodes);

                          if (activeInstance?.id === inst.id) {
                            setActiveInstance(null);
                          }

                          const res = await experiencesService.updateServiceInstances(experienceId, updatedInstances);
                          if (res.ok) {
                            showToast('success', 'Service deleted successfully');
                          } else {
                            showToast('error', res.error.message || 'Failed to delete service');
                          }
                        }
                      }}
                      className="text-slate-500 dark:text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-500/10 rounded transition-colors"
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
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
        {!activeInstance ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-8 text-center">
            <Settings className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm font-bold">Select a Service to Configure</p>
            <p className="text-xs mt-2 mb-6">Adjust the settings and preview the visual output of the attached service.</p>
            
            {serviceInstances.length === 0 && availableDefinitions.length > 0 && (
              <div className="p-6 border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex flex-col items-center">
                <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200 mb-2">No service attached yet</p>
                <p className="text-xs text-indigo-500 dark:text-indigo-400 mb-4 max-w-xs text-center">Most experiences only need one service. Attach one instantly at the origin [0,0,0].</p>
                <div className="flex gap-2 w-full">
                  <select 
                    className="flex-1 text-sm border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
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
                      
                      await experiencesService.updateServiceInstances(experienceId, updatedInstances);
                      await experiencesService.updateNodes(experienceId, updatedNodes);
                      
                      setContents(extractContents(updatedInstances));
                      showToast('success', 'Service instantly attached!');
                      setActiveInstance(newInst);
                      setServiceConfigData({ ...newInst.configuration });
                      setServiceContentData({ ...(newInst as any).content });
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
            {(() => {
              const def = availableDefinitions.find(d => d.id === activeInstance.serviceDefinitionId);
              if (def?.name === 'Notice Board') {
                return (
                  <div className="flex-1 flex flex-col h-full overflow-hidden p-4">
                    <div className="flex-1 min-h-[400px] overflow-y-auto pr-2">
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
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
                      <button 
                        onClick={async () => {
                          const updatedInstances = serviceInstances.map(inst => 
                            inst.id === activeInstance.id ? { ...inst, configuration: serviceConfigData, content: serviceContentData } as any : inst
                          );
                          setServiceInstances(updatedInstances);
                          setActiveInstance({ ...activeInstance, configuration: serviceConfigData, content: serviceContentData } as any);
                          
                          const res = await experiencesService.updateServiceInstances(experienceId, updatedInstances);
                          if (res.ok) {
                            setContents(extractContents(updatedInstances));
                            showToast('success', 'Notice Board Saved to Backend');
                          } else {
                            showToast('error', res.error.message || 'Failed to save Notice Board');
                          }
                        }}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg font-bold py-3 rounded-xl text-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
                      >
                        Save Notice Board Configuration & Content
                      </button>
                    </div>
                  </div>
                );
              }
              
              if (def?.name === 'Classroom') {
                return (
                  <div className="flex-1 flex flex-col h-full overflow-hidden p-4">
                    <div className="flex-1 min-h-[400px] overflow-y-auto pr-2">
                      <ClassroomEditor 
                        key={activeInstance.id}
                        instance={activeInstance} 
                        config={serviceConfigData} 
                        onConfigChange={setServiceConfigData}
                        content={serviceContentData}
                        onContentChange={setServiceContentData}
                      />
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
                      <button 
                        onClick={async () => {
                          const updatedInstances = serviceInstances.map(inst => 
                            inst.id === activeInstance.id ? { ...inst, configuration: serviceConfigData, content: serviceContentData } as any : inst
                          );
                          setServiceInstances(updatedInstances);
                          setActiveInstance({ ...activeInstance, configuration: serviceConfigData, content: serviceContentData } as any);
                          const res = await experiencesService.updateServiceInstances(experienceId, updatedInstances);
                          if (res.ok) {
                            setContents(extractContents(updatedInstances));
                            showToast('success', 'Classroom config saved');
                          } else {
                            showToast('error', res.error.message || 'Failed to save Classroom config');
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                      >
                        Save Classroom
                      </button>
                    </div>
                  </div>
                );
              }

              if (def?.name === 'Complaint Box') {
                return (
                  <div className="flex-1 flex flex-col h-full overflow-hidden p-4">
                    <div className="flex-1 min-h-[400px] overflow-y-auto pr-2">
                      <ComplaintBoxEditor 
                        key={activeInstance.id}
                        instance={activeInstance} 
                        config={serviceConfigData} 
                        onConfigChange={setServiceConfigData}
                      />
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
                      <button 
                        onClick={async () => {
                          const updatedInstances = serviceInstances.map(inst => 
                            inst.id === activeInstance.id ? { ...inst, configuration: serviceConfigData, content: serviceContentData } as any : inst
                          );
                          setServiceInstances(updatedInstances);
                          setActiveInstance({ ...activeInstance, configuration: serviceConfigData, content: serviceContentData } as any);
                          const res = await experiencesService.updateServiceInstances(experienceId, updatedInstances);
                          if (res.ok) {
                            setContents(extractContents(updatedInstances));
                            showToast('success', 'Complaint Box config saved');
                          } else {
                            showToast('error', res.error.message || 'Failed to save Complaint Box config');
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                      >
                        Save Complaint Box Settings
                      </button>
                    </div>
                  </div>
                );
              }

              if (def?.name === 'Staff Details') {
                return (
                  <div className="flex-1 flex flex-col h-full overflow-hidden p-4">
                    <div className="flex-1 min-h-[400px] overflow-y-auto pr-2">
                      <StaffDetailsEditor 
                        key={activeInstance.id}
                        instance={activeInstance} 
                        config={serviceConfigData} 
                        onConfigChange={setServiceConfigData}
                      />
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
                      <button 
                        onClick={async () => {
                          const updatedInstances = serviceInstances.map(inst => 
                            inst.id === activeInstance.id ? { ...inst, configuration: serviceConfigData, content: serviceContentData } as any : inst
                          );
                          setServiceInstances(updatedInstances);
                          setActiveInstance({ ...activeInstance, configuration: serviceConfigData, content: serviceContentData } as any);
                          const res = await experiencesService.updateServiceInstances(experienceId, updatedInstances);
                          if (res.ok) {
                            setContents(extractContents(updatedInstances));
                            showToast('success', 'Staff Details config saved');
                          } else {
                            showToast('error', res.error.message || 'Failed to save Staff Details config');
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                      >
                        Save Staff Details
                      </button>
                    </div>
                  </div>
                );
              }

              // Default Fallback Schema Editor
              return (
                <div className="flex flex-col md:flex-row h-full">
                  <div className="flex-1 p-6 overflow-y-auto border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-indigo-500" />
                      Configure {activeInstance.name}
                    </h3>
              
                    {(() => {
                      if (!def || !def.configurationSchema || Object.keys(def.configurationSchema).length === 0) {
                        return (
                          <div className="p-8 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                            <AlertCircle className="w-8 h-8 text-slate-500 dark:text-slate-400 mx-auto mb-3" />
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Configuration Required</h4>
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-6">
                          {Object.entries(def.configurationSchema).map(([key, field]: [string, any]) => (
                            <div key={key}>
                              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                              </label>
                              
                              {field.type === 'string' && (
                                <input 
                                  type="text" 
                                  value={serviceConfigData[key] || ''}
                                  onChange={(e) => setServiceConfigData({...serviceConfigData, [key]: e.target.value})}
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                              )}
                              
                              {field.type === 'number' && (
                                <input 
                                  type="number" 
                                  value={serviceConfigData[key] || ''}
                                  onChange={(e) => setServiceConfigData({...serviceConfigData, [key]: parseInt(e.target.value) || 0})}
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                              )}

                              {field.type === 'select' && (
                                <select 
                                  value={serviceConfigData[key] || ''}
                                  onChange={(e) => setServiceConfigData({...serviceConfigData, [key]: e.target.value})}
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                >
                                  {field.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              )}

                              {field.type === 'boolean' && (
                                <div className="flex items-center gap-3 mt-2">
                                  <button 
                                    onClick={() => setServiceConfigData({...serviceConfigData, [key]: !serviceConfigData[key]})}
                                    className={`w-10 h-5 rounded-full p-1 transition-colors ${serviceConfigData[key] ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                  >
                                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${serviceConfigData[key] ? 'translate-x-5' : 'translate-x-0'}`} />
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
                              {field.description && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{field.description}</p>}
                            </div>
                          ))}
                          
                          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                            <button 
                              onClick={async () => {
                                const updatedInstances = serviceInstances.map(inst => 
                                  inst.id === activeInstance.id ? { ...inst, configuration: serviceConfigData } : inst
                                );
                                setServiceInstances(updatedInstances);
                                setActiveInstance({ ...activeInstance, configuration: serviceConfigData } as any);
                                
                                const res = await experiencesService.updateServiceInstances(experienceId, updatedInstances);
                                if (res.ok) {
                                  setContents(extractContents(updatedInstances));
                                  showToast('success', 'Service Configuration Saved to Backend');
                                } else {
                                  showToast('error', res.error.message || 'Failed to save configuration');
                                }
                              }}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                            >
                              Save Instance Configuration
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Mobile Preview */}
                  <div className="w-full md:w-[320px] bg-slate-100 dark:bg-slate-900/50 flex flex-col items-center justify-center p-6 shrink-0 relative">
                    <span className="absolute top-4 left-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Live AR Preview</span>
                    
                    <div className="w-[280px] h-[580px] bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl relative border-4 border-slate-700 flex flex-col overflow-hidden">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-800 rounded-b-xl z-20" />
                      
                      <div className="flex-1 bg-white dark:bg-slate-800 rounded-[2rem] overflow-hidden flex flex-col">
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-6 text-center">
                          <BoxSelect className="w-8 h-8 mb-3 opacity-50" />
                          <p className="text-xs font-bold">Live Preview Active</p>
                        </div>
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
  );
}
