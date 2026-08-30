'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Video, Move, Maximize, RotateCw, Trash2, Plus, Settings, Type, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { ServiceInstance } from '../../types/api';

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'text';
  url?: string;
  x: number; // 0 to 1
  y: number; // 0 to 1
  width: number; // 0 to 1
  height: number; // 0 to 1
  rotation: number; // degrees
  // For text
  title?: string;
  description?: string;
  color?: string;
  bgColor?: string;
}

interface Page {
  id: string;
  mediaItems: MediaItem[];
}

interface NoticeBoardEditorProps {
  instance: ServiceInstance;
  config: Record<string, any>;
  onConfigChange: (config: Record<string, any>) => void;
  content: Record<string, any>;
  onContentChange: (content: Record<string, any>) => void;
  onAddMediaRequest?: (type: 'image' | 'video', onSelect: (url: string) => void) => void;
}

export function NoticeBoardEditor({ instance, config, onConfigChange, content, onContentChange, onAddMediaRequest }: NoticeBoardEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle backwards compatibility for legacy mediaItems without pages
  const initialPages: Page[] = content?.pages || (content?.mediaItems ? [{ id: 'page_legacy', mediaItems: content.mediaItems }] : [{ id: 'page_1', mediaItems: [] }]);
  
  const [pages, setPages] = useState<Page[]>(initialPages);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [itemStart, setItemStart] = useState({ x: 0, y: 0 });

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const [itemStartSize, setItemStartSize] = useState({ width: 0, height: 0 });
  const [isPropertiesExpanded, setIsPropertiesExpanded] = useState(true);

  // Auto-expand properties when selecting a new item
  useEffect(() => {
    if (selectedId) {
      setIsPropertiesExpanded(true);
    }
  }, [selectedId]);

  useEffect(() => {
    onContentChange({ ...content, pages });
  }, [pages]);

  const currentPage = pages[currentPageIndex] || pages[0] || { id: 'fallback', mediaItems: [] };
  const items = currentPage.mediaItems || [];

  const updateItems = (newItems: MediaItem[]) => {
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...newPages[currentPageIndex], mediaItems: newItems };
    setPages(newPages);
  };

  const addMedia = (type: 'image' | 'video' | 'text') => {
    const add = (selectedUrl?: string) => {
      const newItem: MediaItem = {
        id: `media_${Date.now()}`,
        type,
        url: selectedUrl,
        x: 0.1,
        y: 0.1,
        width: type === 'text' ? 0.6 : 0.3,
        height: type === 'text' ? 0.4 : 0.3,
        rotation: 0,
        title: type === 'text' ? 'New Announcement' : undefined,
        description: type === 'text' ? 'Enter details here...' : undefined,
        color: type === 'text' ? '#ffffff' : undefined,
        bgColor: type === 'text' ? '#4f46e5' : undefined,
      };
      updateItems([...items, newItem]);
      setSelectedId(newItem.id);
    };

    if ((type === 'image' || type === 'video') && onAddMediaRequest) {
      onAddMediaRequest(type, add);
    } else {
      add(type === 'image' ? 'https://via.placeholder.com/150' : (type === 'video' ? 'https://www.w3schools.com/html/mov_bbb.mp4' : undefined));
    }
  };

  const removeMedia = (id: string) => {
    updateItems(items.filter(i => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const addPage = () => {
    setPages([...pages, { id: `page_${Date.now()}`, mediaItems: [] }]);
    setCurrentPageIndex(pages.length);
    setSelectedId(null);
  };

  const deleteCurrentPage = () => {
    if (pages.length <= 1) return;
    const newPages = pages.filter((_, idx) => idx !== currentPageIndex);
    setPages(newPages);
    setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
    setSelectedId(null);
  };

  // Convert pixels to normalized values
  const toNormalized = (px: number, isWidth: boolean) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    return px / (isWidth ? rect.width : rect.height);
  };

  const handlePointerDown = (e: React.PointerEvent, id: string, action: 'drag' | 'resize') => {
    e.stopPropagation();
    setSelectedId(id);
    const item = items.find(i => i.id === id);
    if (!item) return;

    if (action === 'drag') {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setItemStart({ x: item.x, y: item.y });
    } else {
      setIsResizing(true);
      setResizeStart({ x: e.clientX, y: e.clientY });
      setItemStartSize({ width: item.width, height: item.height });
      setItemStart({ x: item.x, y: item.y });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!selectedId) return;

    if (isDragging) {
      const dx = toNormalized(e.clientX - dragStart.x, true);
      const dy = toNormalized(e.clientY - dragStart.y, false);
      
      updateItems(items.map(item => {
        if (item.id === selectedId) {
          return {
            ...item,
            x: Math.max(0, Math.min(1 - item.width, itemStart.x + dx)),
            y: Math.max(0, Math.min(1 - item.height, itemStart.y + dy))
          };
        }
        return item;
      }));
    } else if (isResizing) {
      const dx = toNormalized(e.clientX - resizeStart.x, true);
      const dy = toNormalized(e.clientY - resizeStart.y, false);
      
      updateItems(items.map(item => {
        if (item.id === selectedId) {
          const newWidth = Math.max(0.1, itemStartSize.width + dx);
          const newHeight = Math.max(0.1, itemStartSize.height + dy);
          return {
            ...item,
            width: Math.min(1 - item.x, newWidth),
            height: Math.min(1 - item.y, newHeight)
          };
        }
        return item;
      }));
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const rotateItem = (id: string) => {
    updateItems(items.map(item => {
      if (item.id === id) {
        return { ...item, rotation: (item.rotation + 90) % 360 };
      }
      return item;
    }));
  };

  const title = config.title || 'Notice Boards';
  const borderColor = config.borderColor || '#4f46e5';

  return (
    <div className="flex flex-col h-full bg-slate-900 relative select-none rounded-xl border border-slate-700 overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Title</span>
            <input 
              type="text" 
              value={title}
              onChange={(e) => onConfigChange({...config, title: e.target.value})}
              className="text-sm font-bold text-slate-200 bg-transparent border-b border-dashed border-slate-600 focus:outline-none focus:border-indigo-500 w-32"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Border</span>
            <input 
              type="color" 
              value={borderColor}
              onChange={(e) => onConfigChange({...config, borderColor: e.target.value})}
              className="w-6 h-6 border-0 rounded cursor-pointer p-0"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Publish</span>
            <input 
              type="datetime-local" 
              value={config.publishAt || ''}
              onChange={(e) => onConfigChange({...config, publishAt: e.target.value})}
              className="text-xs font-mono text-slate-300 bg-slate-900 border border-slate-700 rounded px-2 py-1 outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expires</span>
            <input 
              type="datetime-local" 
              value={config.expiresAt || ''}
              onChange={(e) => onConfigChange({...config, expiresAt: e.target.value})}
              className="text-xs font-mono text-slate-300 bg-slate-900 border border-slate-700 rounded px-2 py-1 outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => addMedia('text')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg shadow-sm"
          >
            <Type className="w-3.5 h-3.5 text-blue-500" /> Add Text
          </button>
          <button 
            onClick={() => addMedia('image')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg shadow-sm"
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-500" /> Add Image
          </button>
          <button 
            onClick={() => addMedia('video')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg shadow-sm"
          >
            <Video className="w-3.5 h-3.5 text-emerald-500" /> Add Video
          </button>
        </div>
      </div>

      {/* Editor Canvas Area */}
      <div 
        className="flex-1 p-8 flex flex-col items-center justify-center overflow-hidden relative"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={() => setSelectedId(null)}
      >
        {/* Background Grid for context */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

        {/* The AR Plane Representation */}
        <div 
          ref={containerRef}
          className="relative bg-white/80 backdrop-blur-sm shadow-xl flex flex-col overflow-hidden"
          style={{
            width: '100%',
            maxWidth: '500px',
            height: '750px', // Fixed height for 3 rows of images
            border: `4px solid ${borderColor}`,
            borderRadius: '12px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Title on the Plane */}
          <div 
            className="w-full text-center py-1 text-xl leading-none font-black uppercase tracking-widest text-white shadow-md relative z-10"
            style={{ backgroundColor: borderColor }}
          >
            {title}
          </div>

          {/* Interactive Bounding Area */}
          <div className="flex-1 relative w-full h-full">
            {items.map(item => (
              <div 
                key={item.id}
                onPointerDown={(e) => handlePointerDown(e, item.id, 'drag')}
                className={`absolute cursor-move overflow-hidden transition-shadow flex flex-col items-center justify-center ${selectedId === item.id ? 'ring-2 ring-indigo-500 ring-offset-2 z-20' : 'ring-1 ring-slate-200 hover:ring-indigo-300 z-10'}`}
                style={{
                  left: `${item.x * 100}%`,
                  top: `${item.y * 100}%`,
                  width: `${item.width * 100}%`,
                  height: `${item.height * 100}%`,
                  transform: `rotate(${item.rotation}deg)`,
                  backgroundColor: item.type === 'image' ? '#e0e7ff' : (item.type === 'text' ? item.bgColor : '#d1fae5'),
                  backgroundImage: item.type === 'image' ? `url(${item.url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: item.type === 'text' ? '8px' : '0'
                }}
              >
                {item.type === 'video' && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-emerald-700/50">
                    <Video className="w-8 h-8 mb-2" />
                    <span className="text-xs font-bold bg-white/80 px-2 py-1 rounded">Video Zone</span>
                  </div>
                )}

                {item.type === 'text' && (
                  <div className="w-full h-full p-4 flex flex-col" style={{ color: item.color }}>
                    <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                    <p className="text-sm whitespace-pre-wrap">{item.description}</p>
                  </div>
                )}
                
                {/* Selection Controls */}
                {selectedId === item.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-indigo-900/10 pointer-events-none">
                    <div className="absolute top-2 right-2 flex flex-col gap-2 pointer-events-auto">
                      <button 
                        onClick={(e) => { e.stopPropagation(); rotateItem(item.id); }}
                        className="p-1.5 bg-slate-800 text-slate-300 rounded-md shadow-md hover:bg-slate-700 transition-colors"
                        title="Rotate 90°"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeMedia(item.id); }}
                        className="p-1.5 bg-slate-800 text-red-400 rounded-md shadow-md hover:bg-red-500/10 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {/* Resize Handle */}
                    <div 
                      onPointerDown={(e) => handlePointerDown(e, item.id, 'resize')}
                      className="absolute bottom-0 right-0 w-6 h-6 bg-indigo-500 cursor-nwse-resize rounded-tl-lg flex items-center justify-center pointer-events-auto shadow-md"
                    >
                      <Maximize className="w-3 h-3 text-white rotate-90" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="mt-6 flex items-center gap-4 z-10 bg-slate-800 px-4 py-2 rounded-full shadow-md border border-slate-700">
          <button 
            disabled={currentPageIndex === 0}
            onClick={(e) => { e.stopPropagation(); setCurrentPageIndex(Math.max(0, currentPageIndex - 1)); setSelectedId(null); }}
            className="p-1 hover:bg-slate-700 rounded disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          
          <span className="text-sm font-bold text-slate-300">
            Page {currentPageIndex + 1} of {pages.length}
          </span>
          
          <button 
            disabled={currentPageIndex === pages.length - 1}
            onClick={(e) => { e.stopPropagation(); setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1)); setSelectedId(null); }}
            className="p-1 hover:bg-slate-700 rounded disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>

          <div className="w-px h-6 bg-slate-700 mx-2"></div>

          <button onClick={(e) => { e.stopPropagation(); addPage(); }} className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-700">
            <Plus className="w-4 h-4" /> Add Page
          </button>

          {pages.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); deleteCurrentPage(); }} className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-700 ml-2">
              <Trash2 className="w-3.5 h-3.5" /> Delete Page
            </button>
          )}
        </div>
      </div>
      
      {/* Properties Sidebar for selected item */}
      {selectedId && (
        <div className="absolute bottom-4 right-4 bg-slate-800 p-4 rounded-xl shadow-2xl border border-slate-700 w-64 text-xs z-30 transition-all">
          <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
            <h4 className="font-bold text-slate-200 flex items-center gap-2">
              <Settings className="w-3.5 h-3.5 text-indigo-500" />
              Item Properties
            </h4>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsPropertiesExpanded(!isPropertiesExpanded); }}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-700 rounded"
              title={isPropertiesExpanded ? "Minimize" : "Expand"}
            >
              {isPropertiesExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
          
          {isPropertiesExpanded && items.filter(i => i.id === selectedId).map(item => (
            <div key={item.id} className="space-y-3">
              {(item.type === 'image' || item.type === 'video') && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Asset URL</label>
                  <input 
                    type="text"
                    value={item.url || ''}
                    onChange={(e) => updateItems(items.map(i => i.id === item.id ? {...i, url: e.target.value} : i))}
                    className="w-full mt-1 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded focus:border-indigo-500 outline-none"
                  />
                </div>
              )}

              {item.type === 'text' && (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Title</label>
                    <input 
                      type="text"
                      value={item.title || ''}
                      onChange={(e) => updateItems(items.map(i => i.id === item.id ? {...i, title: e.target.value} : i))}
                      className="w-full mt-1 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded focus:border-indigo-500 outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                    <textarea 
                      value={item.description || ''}
                      rows={3}
                      onChange={(e) => updateItems(items.map(i => i.id === item.id ? {...i, description: e.target.value} : i))}
                      className="w-full mt-1 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Text Color</label>
                      <input 
                        type="color"
                        value={item.color || '#ffffff'}
                        onChange={(e) => updateItems(items.map(i => i.id === item.id ? {...i, color: e.target.value} : i))}
                        className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Background</label>
                      <input 
                        type="color"
                        value={item.bgColor || '#4f46e5'}
                        onChange={(e) => updateItems(items.map(i => i.id === item.id ? {...i, bgColor: e.target.value} : i))}
                        className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 mt-2">
                <div className="bg-slate-900 p-1.5 rounded border border-slate-800">X: {(item.x * 100).toFixed(1)}%</div>
                <div className="bg-slate-900 p-1.5 rounded border border-slate-800">Y: {(item.y * 100).toFixed(1)}%</div>
                <div className="bg-slate-900 p-1.5 rounded border border-slate-800">W: {(item.width * 100).toFixed(1)}%</div>
                <div className="bg-slate-900 p-1.5 rounded border border-slate-800">H: {(item.height * 100).toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
