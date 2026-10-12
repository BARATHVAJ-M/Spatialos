'use client';

import React from 'react';
import { Plus, Trash2, Clock, Calendar, CheckSquare, Bell, School, PersonStanding, UserCircle, Settings2, Smartphone } from 'lucide-react';

interface ReminderEntry {
  id: string;
  title: string;
  description: string;
  active: boolean;
  expirationDate: string;
}

interface ClassroomEditorProps {
  instance: any;
  config: Record<string, any>;
  onConfigChange: (config: Record<string, any>) => void;
  content: Record<string, any>;
  onContentChange: (content: Record<string, any>) => void;
}

export function ClassroomEditor({ config, onConfigChange, content, onContentChange }: ClassroomEditorProps) {
  const className = config.className || '';
  const displayOptions = config.displayOptions || { showReminders: true, showNextClass: true };
  const currentClass = config.currentClass || { subject: '', staff: '', time: '' };
  const nextClass = config.nextClass || { subject: '', staff: '', time: '' };
  const reminders: ReminderEntry[] = content.reminders || [];

  const handleDisplayOptionChange = (key: string, value: boolean) => {
    onConfigChange({
      ...config,
      displayOptions: { ...displayOptions, [key]: value }
    });
  };

  const handleCurrentClassChange = (field: string, value: string) => {
    onConfigChange({
      ...config,
      currentClass: { ...currentClass, [field]: value }
    });
  };

  const handleNextClassChange = (field: string, value: string) => {
    onConfigChange({
      ...config,
      nextClass: { ...nextClass, [field]: value }
    });
  };

  const addReminder = () => {
    const newReminder: ReminderEntry = {
      id: `rem_${Date.now()}`,
      title: 'New Reminder',
      description: 'Reminder details...',
      active: true,
      expirationDate: ''
    };
    onContentChange({ ...content, reminders: [...reminders, newReminder] });
  };

  const updateReminder = (id: string, field: keyof ReminderEntry, value: any) => {
    onContentChange({
      ...content,
      reminders: reminders.map(r => r.id === id ? { ...r, [field]: value } : r)
    });
  };

  const removeReminder = (id: string) => {
    onContentChange({
      ...content,
      reminders: reminders.filter(r => r.id !== id)
    });
  };

  const formatTime = (time24: string) => {
    if (!time24) return '00:00';
    try {
      const parts = time24.split(':');
      const hour = parseInt(parts[0], 10);
      const minute = parts[1];
      const period = hour >= 12 ? 'PM' : 'AM';
      let hour12 = hour % 12;
      if (hour12 === 0) hour12 = 12;
      return `${hour12}:${minute} ${period}`;
    } catch (_) {
      return time24;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-slate-50 dark:bg-slate-900 rounded-xl">
      {/* LEFT COLUMN: Editor Form */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto border-r border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 z-10 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-indigo-400" />
            Classroom Settings
          </h3>
        </div>

        <div className="p-4 space-y-6 pb-20">
          {/* General Configuration Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Class Name</label>
              <input 
                type="text" 
                value={className}
                onChange={(e) => onConfigChange({ ...config, className: e.target.value })}
                placeholder="e.g., III IT A"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <input 
                  type="checkbox" 
                  checked={displayOptions.showNextClass}
                  onChange={(e) => handleDisplayOptionChange('showNextClass', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Show Next Class Panel</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <input 
                  type="checkbox" 
                  checked={displayOptions.showReminders}
                  onChange={(e) => handleDisplayOptionChange('showReminders', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Show Reminders Panel</span>
              </label>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-700" />

          {/* Current Class Configuration */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Current Class (NOW)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Subject</label>
                <input 
                  type="text" 
                  value={currentClass.subject}
                  onChange={(e) => handleCurrentClassChange('subject', e.target.value)}
                  placeholder="e.g., Mathematics"
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Time (End)</label>
                <input 
                  type="time" 
                  value={currentClass.time}
                  onChange={(e) => handleCurrentClassChange('time', e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Staff Name</label>
                <input 
                  type="text" 
                  value={currentClass.staff}
                  onChange={(e) => handleCurrentClassChange('staff', e.target.value)}
                  placeholder="e.g., Prof. Alan Turing"
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic">Leave subject empty to show &quot;No Ongoing Class&quot;.</p>
          </div>

          {displayOptions.showNextClass && (
            <>
              <hr className="border-slate-200 dark:border-slate-700" />
              {/* Next Class Configuration */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Next Class (UP NEXT)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Subject</label>
                    <input 
                      type="text" 
                      value={nextClass.subject}
                      onChange={(e) => handleNextClassChange('subject', e.target.value)}
                      placeholder="e.g., Physics"
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Time (Start)</label>
                    <input 
                      type="time" 
                      value={nextClass.time}
                      onChange={(e) => handleNextClassChange('time', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-slate-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Staff Name</label>
                    <input 
                      type="text" 
                      value={nextClass.staff}
                      onChange={(e) => handleNextClassChange('staff', e.target.value)}
                      placeholder="e.g., Prof. Richard Feynman"
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-slate-500"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {displayOptions.showReminders && (
            <>
              <hr className="border-slate-200 dark:border-slate-700" />
              {/* Reminders Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5" /> Reminders
                  </h4>
                  <button 
                    onClick={addReminder}
                    className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded transition-colors"
                  >
                    <Plus className="w-3 h-3" /> ADD
                  </button>
                </div>
                
                {reminders.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 text-xs border border-dashed border-slate-300 dark:border-slate-700 rounded">No active reminders.</div>
                ) : (
                  <div className="space-y-3">
                    {reminders.map((reminder) => (
                      <div key={reminder.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg relative group">
                        <button 
                          onClick={() => removeReminder(reminder.id)}
                          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="pr-6 space-y-2">
                          <input 
                            type="text" 
                            value={reminder.title}
                            onChange={(e) => updateReminder(reminder.id, 'title', e.target.value)}
                            placeholder="Reminder Title"
                            className="w-full bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 pb-1 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                          />
                          <textarea 
                            value={reminder.description}
                            onChange={(e) => updateReminder(reminder.id, 'description', e.target.value)}
                            placeholder="Description"
                            rows={2}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-amber-500 resize-none"
                          />
                          <label className="flex items-center gap-2 cursor-pointer pt-1">
                            <input 
                              type="checkbox" 
                              checked={reminder.active}
                              onChange={(e) => updateReminder(reminder.id, 'active', e.target.checked)}
                              className="w-3.5 h-3.5 text-amber-500 rounded bg-slate-100 border-slate-300"
                            />
                            <span className="text-[10px] font-semibold text-slate-500">Active</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Realistic 2D Preview */}
      <div className="flex-1 bg-slate-200 dark:bg-slate-950 flex flex-col items-center justify-center p-6 overflow-y-auto relative min-h-[500px]">
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg z-10">
          <Smartphone className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white tracking-widest uppercase">Live Preview Simulation</span>
        </div>

        {/* The Device Frame / Card Wrapper */}
        <div 
          className="w-full max-w-[420px] rounded-[24px] overflow-hidden shadow-2xl relative my-auto"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.95)', // Deep Space OLED (#0F172A)
            border: '2px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 0 40px rgba(34, 211, 238, 0.1)'
          }}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/10 bg-white/5 flex items-center">
            <School className="w-7 h-7 text-cyan-400 shrink-0" />
            <div className="ml-3 flex-1 min-w-0">
              <h2 className="text-white text-xl font-bold tracking-widest truncate">{className || 'Classroom'}</h2>
            </div>
            <div className={`ml-2 px-3 py-1.5 rounded-full border text-[10px] font-bold shrink-0 ${currentClass?.subject ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-green-500/20 border-green-500 text-green-500'}`}>
              {currentClass?.subject ? 'OCCUPIED' : 'AVAILABLE'}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Current Class */}
            {currentClass?.subject ? (
              <div>
                <span className="text-cyan-400 text-xs font-black tracking-[0.2em] block mb-2">NOW</span>
                <div className="bg-[#1E293B] border border-cyan-400/30 rounded-2xl p-5">
                  <h3 className="text-white text-2xl font-bold truncate">{currentClass.subject}</h3>
                  <div className="flex items-center mt-3 text-white/70">
                    <UserCircle className="w-5 h-5 mr-2 shrink-0" />
                    <span className="text-sm truncate flex-1">{currentClass.staff || 'TBD'}</span>
                    <Clock className="w-5 h-5 mr-2 ml-2 shrink-0" />
                    <span className="text-white font-bold text-sm shrink-0">{formatTime(currentClass.time)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-green-400 text-xs font-black tracking-[0.2em] block mb-2">NOW</span>
                <div className="bg-[#1E293B] border border-green-400/30 rounded-2xl p-5 flex items-center justify-center">
                  <span className="text-white/50 text-lg font-medium italic">No Ongoing Class</span>
                </div>
              </div>
            )}

            {/* Next Class */}
            {displayOptions.showNextClass && nextClass?.subject && (
              <div>
                <span className="text-white/50 text-xs font-black tracking-[0.2em] block mb-2">UP NEXT</span>
                <div className="bg-[#1E293B]/50 border border-white/10 rounded-2xl p-4 flex items-center">
                  <div className="flex-1 min-w-0 mr-4">
                    <h4 className="text-white text-lg font-bold truncate">{nextClass.subject}</h4>
                    <p className="text-white/50 text-xs truncate mt-1">{nextClass.staff || 'TBD'}</p>
                  </div>
                  <div className="bg-black/30 px-3 py-2 rounded-xl shrink-0">
                    <span className="text-white font-bold text-sm">{formatTime(nextClass.time)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Reminders */}
            {displayOptions.showReminders && reminders.filter(r => r.active).length > 0 && (
              <div>
                <span className="text-amber-400 text-xs font-black tracking-[0.2em] block mb-2">REMINDERS</span>
                <div className="space-y-3">
                  {reminders.filter(r => r.active).map(r => (
                    <div key={r.id} className="bg-amber-400/10 border border-amber-400/30 rounded-2xl p-4 flex items-start">
                      <Bell className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 mr-3" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-sm font-bold truncate">{r.title || 'Untitled Reminder'}</h4>
                        {r.description && <p className="text-white/70 text-xs mt-1 line-clamp-2 leading-relaxed">{r.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
