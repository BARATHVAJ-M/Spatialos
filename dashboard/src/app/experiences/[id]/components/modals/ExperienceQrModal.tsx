'use client';

import { X, AlertCircle, Copy, Download } from 'lucide-react';
import { ExperienceEditorContext } from '../../hooks/useExperienceEditor';

interface ExperienceQrModalProps {
  editor: ExperienceEditorContext;
}

export function ExperienceQrModal({ editor }: ExperienceQrModalProps) {
  const {
    showQrModal,
    setShowQrModal,
    exp,
    experienceId,
    qrStickerTheme,
    setQrStickerTheme,
    qrCanvasRef,
    handleDownloadQrPng,
    showToast,
  } = editor;

  if (!showQrModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowQrModal(false)} />
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-sm overflow-hidden relative z-10 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Experience QR Anchor</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-widest font-semibold">User Access Point</p>
          </div>
          <button onClick={() => setShowQrModal(false)} className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 flex flex-col items-center space-y-5">
          {exp.pubStatus !== 'Published' && (
            <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span><strong>Draft Experience:</strong> Publish before scanning on mobile devices.</span>
            </div>
          )}

          {/* Sticker Style Selector */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-semibold">
            <button 
              onClick={() => setQrStickerTheme('branded')}
              className={`px-3 py-1 rounded-md transition-colors ${qrStickerTheme === 'branded' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-500 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Branded
            </button>
            <button 
              onClick={() => setQrStickerTheme('standard')}
              className={`px-3 py-1 rounded-md transition-colors ${qrStickerTheme === 'standard' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-500 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
            >
              High-Contrast
            </button>
            <button 
              onClick={() => setQrStickerTheme('minimal')}
              className={`px-3 py-1 rounded-md transition-colors ${qrStickerTheme === 'minimal' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-500 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Minimal
            </button>
          </div>

          {/* Real HTML5 Canvas */}
          <div className="p-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-md">
            <canvas ref={qrCanvasRef} className="w-56 h-56 rounded-lg" />
          </div>

          <div className="w-full text-center space-y-1 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Anchor UUID:</span>
              <button 
                onClick={() => { navigator.clipboard.writeText(`LOC-${experienceId}`); showToast('success', 'Copied Anchor UUID'); }}
                className="text-indigo-500 dark:text-indigo-400 font-semibold hover:underline text-[11px] flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copy String
              </button>
            </div>
            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 block text-left truncate">{`LOC-${experienceId}`}</span>
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
              className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              Print Sticker
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
