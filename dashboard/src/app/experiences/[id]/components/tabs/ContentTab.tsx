'use client';

import { ImageIcon, Box, Eye } from 'lucide-react';
import { ExperienceEditorContext } from '../../hooks/useExperienceEditor';

interface ContentTabProps {
  editor: ExperienceEditorContext;
}

export function ContentTab({ editor }: ContentTabProps) {
  const { contents, setShowPreviewAssetModal } = editor;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Scene Media Assets</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Media and content assets used across attached services.</p>
      </div>

      {contents.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 text-sm">
          No media assets attached yet. Upload images or videos via the attached service editors.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {contents.map((item) => (
            <div key={item.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900 flex flex-col justify-between">
              <div className="p-4 space-y-3">
                <div className="h-28 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {item.type === 'Image' && <ImageIcon className="w-8 h-8 text-indigo-400" />}
                  {item.type === '3D Model' && <Box className="w-8 h-8 text-emerald-400" />}
                  <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-slate-900/80 text-white px-1.5 py-0.5 rounded">{item.size}</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">{item.name}</h4>
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <button 
                  onClick={() => setShowPreviewAssetModal(item)}
                  className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview Asset
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
