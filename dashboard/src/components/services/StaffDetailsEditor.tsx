import React, { useState, useEffect } from 'react';
import { ServiceInstance } from '../../types/api';
import { apiFetch, BASE_URL } from '../../lib/api';
import { User, Clock, Phone, Mail } from 'lucide-react';

interface StaffDetailsEditorProps {
  instance: ServiceInstance;
  config: Record<string, any>;
  onConfigChange: (newConfig: Record<string, any>) => void;
}

export function StaffDetailsEditor({ instance, config, onConfigChange }: StaffDetailsEditorProps) {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const data = (await apiFetch('/staff')) as any[];
        setStaffList(data);
      } catch (err) {
        console.error('Failed to fetch staff directory:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const handleChange = (field: string, value: any) => {
    onConfigChange({ ...config, [field]: value });
  };

  const selectedStaff = staffList.find(s => s.staffId === config.staffId);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Staff Details Configuration</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          This service acts as a dynamic digital nameplate. Select a staff member from the directory to display their profile.
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select Staff Member (Required)
            </label>
            {loading ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">Loading directory...</div>
            ) : (
              <select
                value={config.staffId || ''}
                onChange={(e) => {
                  const id = e.target.value;
                  const staff = staffList.find(s => s.staffId === id);
                  onConfigChange({ 
                    ...config, 
                    staffId: id, 
                    photoUrl: staff?.photoUrl, 
                    staffName: staff?.name 
                  });
                }}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="" disabled>-- Choose Staff --</option>
                {staffList.map(staff => (
                  <option key={staff.staffId} value={staff.staffId}>
                    {staff.name} - {staff.designation || staff.department || 'No dept'}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Display Options</h4>
            
            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={config.displayContact !== false}
                  onChange={(e) => handleChange('displayContact', e.target.checked)}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${config.displayContact !== false ? 'bg-cyan-500' : 'bg-slate-100 dark:bg-slate-700'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.displayContact !== false ? 'translate-x-4' : ''}`}></div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-slate-900 dark:text-white font-medium group-hover:text-cyan-400 transition-colors">Show Contact Info</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Display phone and email to users</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={config.displayTimetable !== false}
                  onChange={(e) => handleChange('displayTimetable', e.target.checked)}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${config.displayTimetable !== false ? 'bg-cyan-500' : 'bg-slate-100 dark:bg-slate-700'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.displayTimetable !== false ? 'translate-x-4' : ''}`}></div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-slate-900 dark:text-white font-medium group-hover:text-cyan-400 transition-colors">Show Timetable</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Display current/next class schedules</span>
              </div>
            </label>
          </div>
        </div>
      </div>
      {/* Live Preview Simulation */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Live Preview Simulation</h4>
        {selectedStaff ? (
          <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-white/10 max-w-sm mx-auto">
            {/* Top Accent Bar */}
            <div className="h-1.5 w-full bg-cyan-500"></div>
            
            <div className="p-5">
              {/* Main Content: Photo Left, Text Right */}
              <div className="flex flex-row gap-5 items-start">
                
                {/* Photo Column */}
                <div className="w-28 h-36 bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-cyan-500/50 shrink-0">
                  {selectedStaff.photoUrl ? (
                    <img 
                      src={selectedStaff.photoUrl.startsWith('http') ? selectedStaff.photoUrl : `${BASE_URL}${selectedStaff.photoUrl}`} 
                      alt={selectedStaff.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <User className="w-10 h-10 text-slate-500" />
                  )}
                </div>
                
                {/* Details Column */}
                <div className="flex flex-col flex-1 text-left min-w-0">
                  <h5 className="text-white text-xl font-bold tracking-tight mb-1 truncate">{selectedStaff.name}</h5>
                  
                  {selectedStaff.designation && (
                    <div className="bg-cyan-500/15 rounded-md px-2 py-1 self-start mb-1.5">
                      <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-wider truncate max-w-full">{selectedStaff.designation}</p>
                    </div>
                  )}
                  
                  <p className="text-slate-400 text-xs font-medium mb-3 truncate">{selectedStaff.department || 'Department'}</p>
                  
                  {/* Contact Info (Inline/Compact) */}
                  {config.displayContact !== false && (selectedStaff.email || selectedStaff.phone) && (
                    <div className="space-y-1.5 mb-3">
                      {selectedStaff.email && (
                        <div className="flex items-center space-x-2 text-slate-200 text-xs">
                          <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">{selectedStaff.email}</span>
                        </div>
                      )}
                      {selectedStaff.phone && (
                        <div className="flex items-center space-x-2 text-slate-200 text-xs">
                          <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{selectedStaff.phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Academic Subjects/Classes */}
                  {(selectedStaff.subjects || selectedStaff.classesInCharge) && (
                    <div className="space-y-2 mt-auto">
                      {selectedStaff.subjects && (
                        <div>
                          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">Subjects</p>
                          <p className="text-white text-[11px] leading-tight truncate">{selectedStaff.subjects}</p>
                        </div>
                      )}
                      {selectedStaff.classesInCharge && (
                        <div>
                          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">Class In Charge</p>
                          <p className="text-white text-[11px] leading-tight truncate">{selectedStaff.classesInCharge}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Timetable Button */}
              {config.displayTimetable !== false && (
                <div className="w-full mt-5">
                  <button className="w-full bg-cyan-500 hover:bg-cyan-400 transition-colors text-white text-sm font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>View Timetable</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center">
            <User className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">Select a staff member from the dropdown to see the preview.</p>
          </div>
        )}
      </div>
    </div>
  );
}
