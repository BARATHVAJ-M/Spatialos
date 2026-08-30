import React, { useState, useEffect } from 'react';
import { X, Search, ImageIcon, Video, FileText, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface ContentPickerModalProps {
  onClose: () => void;
  onSelect: (url: string, type: 'image' | 'video') => void;
  filterType?: 'image' | 'video' | 'all';
}

export function ContentPickerModal({ onClose, onSelect, filterType = 'all' }: ContentPickerModalProps) {
  const [contents, setContents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContents = async () => {
      try {
        const data = await apiFetch<any[]>('/content');
        if (data) {
          const filtered = data.filter((c: any) => {
            if (filterType === 'all') return true;
            if (filterType === 'image') return c.assetType === 'Image';
            if (filterType === 'video') return c.assetType === 'Video';
            return true;
          });
          setContents(filtered);
        }
      } catch (error) {
        console.error('Failed to fetch contents:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContents();
  }, [filterType]);

  const handleSelect = (content: any) => {
    const type = content.assetType === 'Video' ? 'video' : 'image';
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${baseUrl}${content.url}`;
    onSelect(url, type);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden relative z-10 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-900">
          <div>
            <h3 className="font-bold text-white">Select Content</h3>
            <p className="text-xs text-slate-400 mt-0.5">Choose an asset from your library</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search assets..." 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-900">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : contents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <ImageIcon className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-300">No assets found.</p>
              <p className="text-xs text-slate-400 mt-1">Upload files in the Content tab first.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {contents.map(content => (
                <div 
                  key={content.id} 
                  onClick={() => handleSelect(content)}
                  className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all group"
                >
                  <div className="h-28 bg-slate-700 flex items-center justify-center relative overflow-hidden group-hover:bg-slate-200 transition-colors">
                    {content.assetType === 'Image' ? <ImageIcon className="w-8 h-8 text-indigo-400" /> : <Video className="w-8 h-8 text-emerald-400" />}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/10 flex items-center justify-center transition-colors">
                      <div className="opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow-lg">
                        Select
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border-t border-slate-800">
                    <p className="text-xs font-bold text-slate-200 truncate">{content.metadata?.originalName || 'Asset'}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{content.assetType}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
