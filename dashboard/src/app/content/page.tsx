'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Filter, Plus, FileText, Image as ImageIcon, Video, MoreVertical, X, UploadCloud, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export default function ContentPage() {
  const [contents, setContents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStep, setUploadStep] = useState<'idle' | 'uploading' | 'completed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchContents = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<any[]>('/content');
      setContents(data || []);
    } catch (error) {
      console.error('Failed to fetch contents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const startUpload = async () => {
    if (!selectedFile) return;

    setUploadStep('uploading');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await apiFetch('/content/upload', {
        method: 'POST',
        body: formData,
      });
      setUploadStep('completed');
      fetchContents();
    } catch (error: any) {
      console.error('Upload failed:', error);
      setErrorMessage(error.message || 'Upload failed');
      setUploadStep('error');
    }
  };

  const resetUpload = () => {
    setShowUploadModal(false);
    setUploadStep('idle');
    setSelectedFile(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const bytesToMB = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative min-h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Content Library</h1>
          <p className="text-slate-400 mt-1 text-sm">Manage, preview, and upload assets to assign to spatial experiences</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Content
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search content library..." 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-700 text-xs uppercase font-semibold text-slate-400 tracking-wider">
                <th className="p-4">Name</th>
                <th className="p-4">Type</th>
                <th className="p-4">Size</th>
                <th className="p-4">URL</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : contents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 bg-slate-900 border-dashed">
                    No content available.
                  </td>
                </tr>
              ) : contents.map((content) => (
                <tr key={content.id} className="hover:bg-slate-700 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-slate-400">
                        {content.assetType === 'Image' ? <ImageIcon className="w-4 h-4" /> : 
                         content.assetType === 'Video' ? <Video className="w-4 h-4" /> : 
                         <FileText className="w-4 h-4" />}
                      </div>
                      <span className="font-medium text-white truncate max-w-[200px]">{content.metadata?.originalName || content.id}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-400">{content.assetType}</td>
                  <td className="p-4 text-sm text-slate-400">{content.metadata?.size ? bytesToMB(content.metadata.size) : 'Unknown'}</td>
                  <td className="p-4 text-sm text-indigo-400 hover:underline max-w-[250px] truncate">
                    <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${content.url}`} target="_blank" rel="noopener noreferrer">
                      {content.url}
                    </a>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={async () => {
                        if (confirm('Are you sure you want to delete this asset?')) {
                          await apiFetch(`/content/${content.id}`, { method: 'DELETE' });
                          fetchContents();
                        }
                      }}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-500/10 rounded-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Flow Dialog Backdrop / Layout */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={resetUpload} />
          
          <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-lg overflow-hidden relative z-10 animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Upload Content Asset</h2>
              <button onClick={resetUpload} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {uploadStep === 'idle' && (
                <div className="space-y-6">
                  {/* File selection box */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-900 hover:bg-slate-100/55 cursor-pointer transition-colors"
                  >
                    <UploadCloud className="w-10 h-10 text-slate-400 mb-4" />
                    {selectedFile ? (
                      <p className="text-sm font-semibold text-slate-300">{selectedFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-300">Click to select file</p>
                        <p className="text-xs text-slate-400 mt-1">Image (10MB) or Video (50MB)</p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*,video/*"
                    onChange={handleFileChange} 
                  />
                  
                  <button 
                    onClick={startUpload}
                    disabled={!selectedFile}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    Upload File
                  </button>
                </div>
              )}

              {uploadStep === 'uploading' && (
                <div className="py-8 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4" />
                  <p className="text-sm font-medium text-slate-300">Uploading and validating file constraints...</p>
                </div>
              )}

              {uploadStep === 'error' && (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                  <h3 className="text-base font-bold text-white">Upload Failed</h3>
                  <p className="text-sm text-slate-400 mt-1">{errorMessage}</p>
                  
                  <button 
                    onClick={() => setUploadStep('idle')}
                    className="mt-6 bg-slate-700 hover:bg-slate-200 text-slate-200 font-medium px-6 py-2 rounded-lg text-sm transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {uploadStep === 'completed' && (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4 animate-bounce" />
                  <h3 className="text-base font-bold text-white">Upload Completed!</h3>
                  <p className="text-sm text-slate-400 mt-1">The content asset has been indexed and is ready to configure.</p>
                  
                  <button 
                    onClick={resetUpload}
                    className="mt-6 bg-slate-900 hover:bg-slate-800 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
