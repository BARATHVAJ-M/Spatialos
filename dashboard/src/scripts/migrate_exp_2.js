const fs = require('fs');
const path = require('path');

const expPath = path.join('d:', 'AR app', 'APP-1', 'dashboard', 'src', 'app', 'experiences', '[id]', 'page.tsx');
let content = fs.readFileSync(expPath, 'utf8');

// 1. Add schemas
const schemas = `
const SERVICE_SCHEMAS: Record<string, any> = {
  'Notice Board': {
    title: { type: 'string', label: 'Board Title', required: true, default: 'General Notices' },
    refreshInterval: { type: 'number', label: 'Refresh Rate (Seconds)', required: true, default: 30, min: 5, max: 3600 },
    enablePagination: { type: 'boolean', label: 'Enable Pagination', required: false, default: true, description: 'Allows sliding multiple announcements' },
    accentColor: { type: 'color', label: 'Accent Theme Color', required: false, default: '#4f46e5' }
  },
  'Complaint Box': {
    title: { type: 'string', label: 'Box Title', required: true, default: 'Feedback Box' },
    allowAnonymous: { type: 'boolean', label: 'Allow Anonymous Submissions', required: false, default: false },
    categories: { type: 'select', label: 'Feedback Categories', options: ['Maintenance', 'Security', 'General'], required: true, default: 'General' },
    maxMessageLength: { type: 'number', label: 'Maximum Message Length', required: true, default: 500, min: 10, max: 2000 }
  },
  'Token System': {
    counterName: { type: 'string', label: 'Counter Name', required: true, default: 'Counter 1' },
    tokenPrefix: { type: 'string', label: 'Token Prefix', required: true, default: 'A-' },
    maximumQueue: { type: 'number', label: 'Maximum Queue Size', required: true, default: 50 },
  }
};
`;
content = content.replace(/const TABS = \[/, schemas + '\nconst TABS = [');

// 2. Add activeServiceConfig and configData states
content = content.replace(/const \[activeNode, setActiveNode\] = useState<ExperienceNode \| null>\(null\);/, 
`const [activeNode, setActiveNode] = useState<ExperienceNode | null>(null);
  
  // Attached Service Configuration State
  const [activeServiceConfig, setActiveServiceConfig] = useState<AttachedService | null>(null);
  const [serviceConfigData, setServiceConfigData] = useState<Record<string, any>>({});`);

// 3. Update the Services tab UI
const servicesTabReplacement = `
      {/* 3. SERVICES TAB */}
      {activeTab === 'services' && (
        <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
          {/* Services List Panel */}
          <div className="w-full lg:w-1/3 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900">Embedded Services</h3>
            </div>
            <div className="space-y-3 pr-1">
              {services.map((srv) => (
                <div 
                  key={srv.id} 
                  onClick={() => {
                    setActiveServiceConfig(srv);
                    const schema = SERVICE_SCHEMAS[srv.type];
                    if (schema) {
                      const initialData: Record<string, any> = {};
                      Object.keys(schema).forEach(key => {
                        initialData[key] = schema[key].default;
                      });
                      setServiceConfigData(initialData);
                    }
                  }}
                  className={\`border rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-colors \${activeServiceConfig?.id === srv.id ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50 border-slate-200 hover:border-indigo-300'}\`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{srv.name}</h4>
                        <span className="text-[10px] text-slate-500 font-mono block">{srv.type} ({srv.version})</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Configuration Form & Preview */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {!activeServiceConfig ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <Settings className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-sm font-bold">Select a Service to Configure</p>
                <p className="text-xs mt-2">Adjust the settings and preview the visual output of the attached service.</p>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row h-full">
                
                {/* Editor Form */}
                <div className="flex-1 p-6 overflow-y-auto border-r border-slate-200 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-indigo-500" />
                    Configure {activeServiceConfig.name}
                  </h3>
                  
                  {Object.keys(SERVICE_SCHEMAS[activeServiceConfig.type] || {}).length === 0 ? (
                    <div className="p-8 text-center bg-white border border-slate-200 rounded-xl">
                      <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                      <h4 className="text-sm font-bold text-slate-900">No Configuration Required</h4>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(SERVICE_SCHEMAS[activeServiceConfig.type] || {}).map(([key, field]: [string, any]) => (
                        <div key={key}>
                          <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          
                          {field.type === 'string' && (
                            <input 
                              type="text" 
                              value={serviceConfigData[key] || ''}
                              onChange={(e) => setServiceConfigData({...serviceConfigData, [key]: e.target.value})}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            />
                          )}
                          
                          {field.type === 'number' && (
                            <input 
                              type="number" 
                              value={serviceConfigData[key] || ''}
                              onChange={(e) => setServiceConfigData({...serviceConfigData, [key]: parseInt(e.target.value) || 0})}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            />
                          )}

                          {field.type === 'select' && (
                            <select 
                              value={serviceConfigData[key] || ''}
                              onChange={(e) => setServiceConfigData({...serviceConfigData, [key]: e.target.value})}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            >
                              {field.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          )}

                          {field.type === 'boolean' && (
                            <div className="flex items-center gap-3 mt-2">
                              <button 
                                onClick={() => setServiceConfigData({...serviceConfigData, [key]: !serviceConfigData[key]})}
                                className={\`w-10 h-5 rounded-full p-1 transition-colors \${serviceConfigData[key] ? 'bg-indigo-600' : 'bg-slate-300'}\`}
                              >
                                <div className={\`w-3 h-3 bg-white rounded-full transition-transform \${serviceConfigData[key] ? 'translate-x-5' : 'translate-x-0'}\`} />
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
                          {field.description && <p className="text-[10px] text-slate-500 mt-1">{field.description}</p>}
                        </div>
                      ))}
                      
                      <div className="pt-4 border-t border-slate-200">
                        <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-lg text-sm transition-colors">
                          Save Instance Configuration
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Preview */}
                <div className="w-full md:w-[320px] bg-slate-100 flex flex-col items-center justify-center p-6 shrink-0 relative">
                  <span className="absolute top-4 left-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live AR Preview</span>
                  
                  {/* Fake iPhone Mockup */}
                  <div className="w-[280px] h-[580px] bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl relative border-4 border-slate-800 flex flex-col overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-800 rounded-b-xl z-20"></div>
                    
                    <div className="flex-1 bg-white rounded-[2rem] overflow-hidden flex flex-col">
                      {activeServiceConfig.type === 'Notice Board' ? (
                        <div className="h-full flex flex-col bg-slate-50">
                          <div className="p-4 text-white" style={{ backgroundColor: serviceConfigData.accentColor || '#4f46e5' }}>
                            <h3 className="text-xl font-bold truncate">{serviceConfigData.title || 'Board Title'}</h3>
                            <p className="text-[10px] opacity-80 mt-1">Refreshes every {serviceConfigData.refreshInterval}s</p>
                          </div>
                          <div className="p-4 space-y-3 overflow-y-auto flex-1">
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                              <h4 className="font-bold text-slate-800 text-xs">Welcome to {exp.targetPlaceName}</h4>
                              <p className="text-[10px] text-slate-500 mt-1">This is a mock announcement.</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                              <h4 className="font-bold text-slate-800 text-xs">System Maintenance</h4>
                              <p className="text-[10px] text-slate-500 mt-1">Downtime expected at 12 AM.</p>
                            </div>
                          </div>
                          {serviceConfigData.enablePagination && (
                            <div className="mt-auto p-3 flex justify-center gap-1.5 bg-white border-t border-slate-100">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: serviceConfigData.accentColor || '#4f46e5' }}></div>
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                            </div>
                          )}
                        </div>
                      ) : activeServiceConfig.type === 'Token System' ? (
                        <div className="h-full flex flex-col bg-white p-6 items-center justify-center text-center">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">{serviceConfigData.counterName || 'Counter'}</h3>
                            <div className="w-40 h-40 rounded-full bg-indigo-50 border-8 border-indigo-100 flex flex-col items-center justify-center mb-6 shadow-inner">
                              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Your Token</span>
                              <span className="text-4xl font-black text-indigo-600 font-mono tracking-tighter">{serviceConfigData.tokenPrefix || 'A-'}042</span>
                            </div>
                            <p className="text-xs font-bold text-slate-500">Max Queue: {serviceConfigData.maximumQueue}</p>
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
            )}
          </div>
        </div>
      )}`;

content = content.replace(/\{\/\* 3\. SERVICES TAB \*\/\}[\s\S]*?\{\/\* 4\. SPATIAL CANVAS TAB \(The 3D Grid Editor\) \*\/\}/, servicesTabReplacement + '\n\n      {/* 4. SPATIAL CANVAS TAB (The 3D Grid Editor) */}');

fs.writeFileSync(expPath, content, 'utf8');
console.log('Experience page Services migration complete.');
