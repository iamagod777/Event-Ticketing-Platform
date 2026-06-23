import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Save, ArrowLeft, Move, Trash2, AlignLeft, AlignCenter, AlignRight, 
  Type, Image as ImageIcon, QrCode, Sliders, Layout, Monitor, Sparkles, Check, HelpCircle
} from 'lucide-react';
import { Event, TemplateElement, ElementType, PhotoShape, TextPlaceholderKey, QRTargetType } from '../types';

interface TemplateEditorProps {
  event: Event;
  onSave: (updatedElements: TemplateElement[]) => Promise<void>;
  onClose: () => void;
}

export default function TemplateEditor({ event, onSave, onClose }: TemplateEditorProps) {
  const [elements, setElements] = useState<TemplateElement[]>(event.elements || []);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Canvas Reference for measuring drag & resize operations
  const canvasRef = useRef<HTMLDivElement>(null);

  // Dragging and Resizing State
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null); // 'nw' | 'ne' | 'se' | 'sw' or null
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartRect = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // Get current selected element
  const selectedElement = elements.find(el => el.id === selectedElementId);

  // Add a new placeholder element
  const addElement = (type: ElementType) => {
    const id = `el-${type}-${Math.random().toString(36).substring(2, 9)}`;
    
    let newEl: TemplateElement = {
      id,
      type,
      x: 35, // default centered coordinates
      y: 40,
      width: 30,
      height: 20,
    };

    if (type === 'photo') {
      newEl.shape = 'circle';
    } else if (type === 'text') {
      newEl.textKey = 'name';
      newEl.fontSize = 24;
      newEl.fontFamily = 'Geist';
      newEl.color = '#ffffff';
      newEl.align = 'center';
      newEl.fontWeight = 'bold';
      newEl.height = 6;
    } else if (type === 'qr') {
      newEl.qrTarget = 'event';
      newEl.width = 15;
      newEl.height = 10;
    }

    setElements([...elements, newEl]);
    setSelectedElementId(id);
  };

  // Delete element
  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  // Update a single property on the selected element
  const updateSelectedElement = (updates: Partial<TemplateElement>) => {
    if (!selectedElementId) return;
    setElements(elements.map(el => {
      if (el.id === selectedElementId) {
        return { ...el, ...updates } as TemplateElement;
      }
      return el;
    }));
  };

  // Drag and Resize handler
  const handleMouseDown = (
    e: React.MouseEvent, 
    element: TemplateElement, 
    action: 'drag' | 'resize', 
    handle?: 'nw' | 'ne' | 'se' | 'sw'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedElementId(element.id);

    if (action === 'drag') {
      setIsDragging(true);
    } else if (action === 'resize' && handle) {
      setIsResizing(handle);
    }

    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartRect.current = {
      x: element.x,
      y: element.y,
      w: element.width,
      h: element.height
    };
  };

  // Global mousemove tracking for dragging & resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!selectedElementId || (!isDragging && !isResizing) || !canvasRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - dragStartPos.current.x) / canvasRect.width) * 100;
      const deltaY = ((e.clientY - dragStartPos.current.y) / canvasRect.height) * 100;

      const start = elementStartRect.current;

      if (isDragging) {
        // Drag calculations (bounding within canvas)
        let newX = Math.max(0, Math.min(100 - start.w, start.x + deltaX));
        let newY = Math.max(0, Math.min(100 - start.h, start.y + deltaY));
        
        // Snapping logic to middle lines (optional helper)
        if (Math.abs(newX + start.w / 2 - 50) < 1.5) {
          newX = 50 - start.w / 2; // snap to horizontal center
        }

        updateSelectedElement({ x: parseFloat(newX.toFixed(2)), y: parseFloat(newY.toFixed(2)) });
      } else if (isResizing) {
        // Resize calculations depending on handle
        let newW = start.w;
        let newH = start.h;
        let newX = start.x;
        let newY = start.y;

        if (isResizing === 'se') {
          newW = Math.max(5, Math.min(100 - start.x, start.w + deltaX));
          newH = Math.max(2, Math.min(100 - start.y, start.h + deltaY));
        } else if (isResizing === 'sw') {
          const possibleW = start.w - deltaX;
          if (possibleW > 5 && start.x + deltaX >= 0) {
            newW = possibleW;
            newX = start.x + deltaX;
          }
          newH = Math.max(2, Math.min(100 - start.y, start.h + deltaY));
        } else if (isResizing === 'ne') {
          newW = Math.max(5, Math.min(100 - start.x, start.w + deltaX));
          const possibleH = start.h - deltaY;
          if (possibleH > 2 && start.y + deltaY >= 0) {
            newH = possibleH;
            newY = start.y + deltaY;
          }
        } else if (isResizing === 'nw') {
          const possibleW = start.w - deltaX;
          const possibleH = start.h - deltaY;
          if (possibleW > 5 && start.x + deltaX >= 0) {
            newW = possibleW;
            newX = start.x + deltaX;
          }
          if (possibleH > 2 && start.y + deltaY >= 0) {
            newH = possibleH;
            newY = start.y + deltaY;
          }
        }

        updateSelectedElement({
          x: parseFloat(newX.toFixed(2)),
          y: parseFloat(newY.toFixed(2)),
          width: parseFloat(newW.toFixed(2)),
          height: parseFloat(newH.toFixed(2))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, selectedElementId]);

  // Handle Keyboard Arrows for micro-pixel adjustments
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElement || !selectedElementId) return;
      
      // If an input is focused, don't trigger moving
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'SELECT') {
        return;
      }

      const step = e.shiftKey ? 1 : 0.2; // Shift moves faster
      let updated = false;
      let newX = selectedElement.x;
      let newY = selectedElement.y;

      if (e.key === 'ArrowUp') {
        newY = Math.max(0, selectedElement.y - step);
        updated = true;
      } else if (e.key === 'ArrowDown') {
        newY = Math.min(100 - selectedElement.height, selectedElement.y + step);
        updated = true;
      } else if (e.key === 'ArrowLeft') {
        newX = Math.max(0, selectedElement.x - step);
        updated = true;
      } else if (e.key === 'ArrowRight') {
        newX = Math.min(100 - selectedElement.width, selectedElement.x + step);
        updated = true;
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteElement(selectedElementId);
        e.preventDefault();
      }

      if (updated) {
        updateSelectedElement({ x: parseFloat(newX.toFixed(2)), y: parseFloat(newY.toFixed(2)) });
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, elements]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(elements);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      alert('Error saving design overlays.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-mono brutalist-grid">
      {/* Visual Editor Header */}
      <header className="border-b-2 border-white/20 bg-black h-16 flex items-center justify-between px-6 shrink-0 relative z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="py-1.5 px-3 border border-white/20 text-white/60 hover:text-white hover:border-white transition flex items-center gap-1.5 text-xs uppercase font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit Editor
          </button>
          <div className="h-6 w-px bg-white/20"></div>
          <div>
            <span className="text-white font-bold block uppercase tracking-wider text-xs">{event.name}</span>
            <span className="text-[10px] text-[#00FF00] uppercase font-mono">POSTER OVERLAY STUDIO / ACTIVE</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#00FF00] font-bold bg-[#00FF00]/10 border border-[#00FF00]/30 px-3 py-1.5 uppercase font-mono">
              <Check className="w-4 h-4" />
              OVERLAYS MOUNTED &amp; SAVED SUCCESS
            </div>
          )}
          <button
            onClick={handleSave}
            id="save-template-btn"
            disabled={isSaving}
            className="bg-[#00FF00] text-black font-extrabold py-2 px-5 rounded-none flex items-center gap-2 cursor-pointer hover:bg-white transition shadow-[4px_4px_0px_rgba(255,255,255,0.2)] hover:shadow-none text-xs uppercase tracking-widest font-mono"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Publish &amp; Save Poster
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Toolbar Drawer: Add Elements */}
        <div className="w-64 border-r-2 border-white/20 bg-black flex flex-col p-5 space-y-6 shrink-0 z-20">
          <div>
            <h3 className="text-[10px] font-bold text-white/40 tracking-widest uppercase mb-4 flex items-center gap-1.5 font-mono">
              <Layout className="w-3.5 h-3.5" /> ADD DESIGN LAYERS
            </h3>
            <p className="text-[11px] text-white/60 mb-4 leading-relaxed font-mono uppercase">
              Place dynamic fields on your poster canvas. They generate automatically on public attendee registrations.
            </p>
          </div>

          <div className="space-y-3 font-mono">
            <button
              onClick={() => addElement('photo')}
              id="add-photo-layer"
              className="w-full bg-black border-2 border-white/20 text-white p-3 rounded-none flex items-center gap-3 hover:border-[#00FF00] cursor-pointer text-left transition group"
            >
              <div className="w-9 h-9 bg-white/5 border border-white/20 group-hover:bg-[#00FF00]/10 group-hover:text-[#00FF00] group-hover:border-[#00FF00]/40 flex items-center justify-center text-white/40 transition">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold block text-white group-hover:text-[#00FF00] uppercase tracking-wider transition">Photo frame</span>
                <span className="text-[9px] text-white/40 uppercase">Attendee profile image</span>
              </div>
            </button>

            <button
              onClick={() => addElement('text')}
              id="add-text-layer"
              className="w-full bg-black border-2 border-white/20 text-white p-3 rounded-none flex items-center gap-3 hover:border-[#00FF00] cursor-pointer text-left transition group"
            >
              <div className="w-9 h-9 bg-white/5 border border-white/20 group-hover:bg-[#00FF00]/10 group-hover:text-[#00FF00] group-hover:border-[#00FF00]/40 flex items-center justify-center text-white/40 transition">
                <Type className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold block text-white group-hover:text-[#00FF00] uppercase tracking-wider transition">Text Field</span>
                <span className="text-[9px] text-white/40 uppercase">&#123;&#123;name&#125;&#125;, &#123;&#123;company&#125;&#125; etc.</span>
              </div>
            </button>

            <button
              onClick={() => addElement('qr')}
              id="add-qr-layer"
              className="w-full bg-black border-2 border-white/20 text-white p-3 rounded-none flex items-center gap-3 hover:border-[#00FF00] cursor-pointer text-left transition group"
            >
              <div className="w-9 h-9 bg-white/5 border border-white/20 group-hover:bg-[#00FF00]/10 group-hover:text-[#00FF00] group-hover:border-[#00FF00]/40 flex items-center justify-center text-white/40 transition">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold block text-white group-hover:text-[#00FF00] uppercase tracking-wider transition">Dynamic QR Code</span>
                <span className="text-[9px] text-white/40 uppercase">Scan to Event link</span>
              </div>
            </button>
          </div>

          <div className="pt-6 border-t border-white/10 space-y-4">
            <span className="block text-[9px] font-bold text-white/40 tracking-widest uppercase">
              Keyboard Shortcuts
            </span>
            <div className="grid grid-cols-2 gap-2 text-[9px] text-white/50 uppercase">
              <div className="bg-black border border-white/10 p-1.5 rounded-none flex flex-col items-center">
                <span className="text-[#00FF00] font-mono">▲▼◀▶</span>
                <span>Nudge Layer</span>
              </div>
              <div className="bg-black border border-white/10 p-1.5 rounded-none flex flex-col items-center">
                <span className="text-[#00FF00] font-mono">SHIFT + KEY</span>
                <span>Move 5x</span>
              </div>
              <div className="bg-black border border-white/10 p-1.5 rounded-none flex flex-col items-center col-span-2">
                <span className="text-[#00FF00] font-mono">DEL / BACKSPACE</span>
                <span>Delete layer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Canvas Workspace */}
        <div className="flex-1 bg-[#121212] flex items-center justify-center p-6 overflow-auto relative z-10">
          <div className="absolute top-4 left-4 text-[10px] text-white/60 flex items-center gap-1.5 bg-black px-3 py-1.5 rounded-none border-2 border-white/20 uppercase font-mono tracking-wider">
            <Monitor className="w-4 h-4 text-[#00FF00]" />
            Drag &amp; position dynamic fields over poster template
          </div>

          {/* Interactive Canva Canvas Frame */}
          <div 
            ref={canvasRef}
            id="poster-drawing-canvas-container"
            onClick={() => setSelectedElementId(null)}
            className="relative bg-black shadow-[12px_12px_0px_rgba(255,255,255,0.1)] border-4 border-white/30 select-none overflow-hidden shrink-0"
            style={{
              width: '450px',
              height: '675px', // maintains 2:3 aspect ratio of 800x1200
              backgroundImage: `url(${event.posterUrl})`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Draw Overlay Elements */}
            {elements.map((el) => {
              const isSelected = el.id === selectedElementId;
              
              // Map percentage coordinates into CSS styles
              const style: React.CSSProperties = {
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: `${el.width}%`,
                height: `${el.height}%`,
                position: 'absolute'
              };

              return (
                <div
                  key={el.id}
                  id={el.id}
                  style={style}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElementId(el.id);
                  }}
                  onMouseDown={(e) => handleMouseDown(e, el, 'drag')}
                  className={`group cursor-move relative flex items-center justify-center transition ${
                    isSelected 
                      ? 'border-2 border-[#00FF00] bg-[#00FF00]/10 z-30' 
                      : 'border border-dashed border-white/40 hover:border-[#00FF00] hover:bg-black/40 z-20'
                  } ${
                    el.type === 'photo' && el.shape === 'circle' ? 'rounded-full' : ''
                  } ${
                    el.type === 'photo' && el.shape === 'rounded-rectangle' ? 'rounded-none border-double border-4' : ''
                  }`}
                >
                  {/* Visual Indicator of Placeholder Type */}
                  {el.type === 'photo' && (
                    <div className="flex flex-col items-center text-center p-1 w-full h-full justify-center bg-black/40">
                      <ImageIcon className={`w-5 h-5 ${isSelected ? 'text-[#00FF00]' : 'text-white/60'}`} />
                      <span className="text-[8px] text-white font-bold mt-1 uppercase tracking-wider">
                        PHOTO FRAME ({el.shape})
                      </span>
                    </div>
                  )}

                  {el.type === 'text' && (
                    <div 
                      className="w-full h-full px-2 py-1 flex items-center select-none overflow-hidden bg-black/40"
                      style={{
                        justifyContent: el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start',
                        color: el.color || '#ffffff',
                        fontFamily: el.fontFamily === 'Geist' ? 'var(--font-sans)' : el.fontFamily === 'JetBrains Mono' ? 'var(--font-mono)' : el.fontFamily,
                        fontSize: `${(el.fontSize || 24) * 0.45}px`, // scaled down for 450px preview canvas
                        fontWeight: el.fontWeight === 'bold' ? 'bold' : 'normal',
                        textAlign: el.align || 'center'
                      }}
                    >
                      &#123;&#123;{el.textKey}&#125;&#125;
                    </div>
                  )}

                  {el.type === 'qr' && (
                    <div className="w-full h-full bg-black/70 p-2 flex flex-col items-center justify-center border border-white/20">
                      <QrCode className="w-6 h-6 text-white" />
                      <span className="text-[7px] text-white font-mono mt-0.5 uppercase">QR: {el.qrTarget}</span>
                    </div>
                  )}

                  {/* Drag Resize Handles only when Selected */}
                  {isSelected && (
                    <>
                      {/* nw resizing dot */}
                      <div 
                        onMouseDown={(e) => handleMouseDown(e, el, 'resize', 'nw')}
                        className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#00FF00] border border-black rounded-none cursor-nwse-resize z-40"
                      />
                      {/* ne resizing dot */}
                      <div 
                        onMouseDown={(e) => handleMouseDown(e, el, 'resize', 'ne')}
                        className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#00FF00] border border-black rounded-none cursor-nesw-resize z-40"
                      />
                      {/* se resizing dot */}
                      <div 
                        onMouseDown={(e) => handleMouseDown(e, el, 'resize', 'se')}
                        className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#00FF00] border border-black rounded-none cursor-nwse-resize z-40"
                      />
                      {/* sw resizing dot */}
                      <div 
                        onMouseDown={(e) => handleMouseDown(e, el, 'resize', 'sw')}
                        className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[#00FF00] border border-black rounded-none cursor-nesw-resize z-40"
                      />
                      
                      {/* Floating Element Move Helper Overlay */}
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black text-[#00FF00] border border-[#00FF00] font-bold font-mono text-[8px] px-1.5 py-0.5 rounded-none shadow-md z-40 whitespace-nowrap uppercase tracking-wider">
                        X:{el.x}% Y:{el.y}%
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Settings Inspector Control Panel */}
        <div className="w-80 border-l-2 border-white/20 bg-black flex flex-col overflow-y-auto shrink-0 relative z-20 font-mono text-xs">
          <div className="p-5 border-b-2 border-white/20">
            <h3 className="text-[10px] font-bold text-white/40 tracking-widest uppercase flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#00FF00]" /> Overlay Inspector
            </h3>
          </div>

          {selectedElement ? (
            <div className="p-5 space-y-6 flex-1">
              
              {/* Common Details */}
              <div className="space-y-2 bg-black p-3.5 rounded-none border-2 border-white/25">
                <span className="text-[9px] bg-[#00FF00]/10 border border-[#00FF00]/40 px-2 py-0.5 text-[#00FF00] uppercase font-mono tracking-wider font-extrabold">
                  {selectedElement.type.toUpperCase()} OVERLAY
                </span>
                <p className="text-[10px] text-white/40 mt-2 uppercase">ID: <span className="font-mono text-white font-bold">{selectedElement.id}</span></p>
                <div className="grid grid-cols-2 gap-3 mt-3 text-[10px] border-t border-white/10 pt-2.5 uppercase text-white/50">
                  <div>
                    <span>X Position</span>
                    <p className="font-bold text-[#00FF00] mt-0.5">{selectedElement.x}%</p>
                  </div>
                  <div>
                    <span>Y Position</span>
                    <p className="font-bold text-[#00FF00] mt-0.5">{selectedElement.y}%</p>
                  </div>
                  <div className="mt-2">
                    <span>Width</span>
                    <p className="font-bold text-white mt-0.5">{selectedElement.width}%</p>
                  </div>
                  <div className="mt-2">
                    <span>Height</span>
                    <p className="font-bold text-white mt-0.5">{selectedElement.height}%</p>
                  </div>
                </div>
              </div>

              {/* Element Specific Configuration */}

              {/* 1. Photo Elements */}
              {selectedElement.type === 'photo' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 tracking-widest uppercase mb-1.5" htmlFor="photo-shape-select">
                      Badge Framing Shape
                    </label>
                    <select
                      id="photo-shape-select"
                      value={selectedElement.shape || 'circle'}
                      onChange={(e) => updateSelectedElement({ shape: e.target.value as PhotoShape })}
                      className="w-full bg-black border-2 border-white/20 rounded-none py-2 px-3 text-white text-xs focus:outline-none focus:border-[#00FF00] transition uppercase"
                    >
                      <option value="circle">Perfect Circle Clip</option>
                      <option value="rounded-rectangle">Double Frame Box</option>
                      <option value="rectangle">Stark Solid Rectangle</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-white/40 leading-relaxed uppercase">
                    Attendees' uploaded profile pictures will automatically align, crop, center, and frame into this custom {selectedElement.shape} geometry.
                  </p>
                </div>
              )}

              {/* 2. Text Elements */}
              {selectedElement.type === 'text' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 tracking-widest uppercase mb-1.5" htmlFor="text-key-select">
                      Dynamic Field Key
                    </label>
                    <select
                      id="text-key-select"
                      value={selectedElement.textKey || 'name'}
                      onChange={(e) => updateSelectedElement({ textKey: e.target.value as TextPlaceholderKey })}
                      className="w-full bg-black border-2 border-white/20 rounded-none py-2 px-3 text-white text-xs focus:outline-none focus:border-[#00FF00] transition font-mono uppercase"
                    >
                      <option value="name">&#123;&#123;name&#125;&#125; (Full Name)</option>
                      <option value="designation">&#123;&#123;designation&#125;&#125; (Role / Title)</option>
                      <option value="company">&#123;&#123;company&#125;&#125; (Company / Org)</option>
                      <option value="college">&#123;&#123;college&#125;&#125; (School / Uni)</option>
                      <option value="city">&#123;&#123;city&#125;&#125; (Location)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-white/40 tracking-widest uppercase mb-1.5" htmlFor="font-family-select">
                      Font Family
                    </label>
                    <select
                      id="font-family-select"
                      value={selectedElement.fontFamily || 'Geist'}
                      onChange={(e) => updateSelectedElement({ fontFamily: e.target.value })}
                      className="w-full bg-black border-2 border-white/20 rounded-none py-2 px-3 text-white text-xs focus:outline-none focus:border-[#00FF00] transition uppercase"
                    >
                      <option value="Geist">Geist (Modern Sans)</option>
                      <option value="JetBrains Mono">JetBrains Mono (Tech/Mono)</option>
                      <option value="Georgia">Georgia (Editorial Serif)</option>
                      <option value="system-ui">System UI (Fallback Sans)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-white/40 tracking-widest uppercase mb-1.5" htmlFor="font-size-input">
                        Font Size (px)
                      </label>
                      <input
                        id="font-size-input"
                        type="number"
                        min={8}
                        max={120}
                        value={selectedElement.fontSize || 24}
                        onChange={(e) => updateSelectedElement({ fontSize: parseInt(e.target.value) || 12 })}
                        className="w-full bg-black border-2 border-white/20 rounded-none py-1.5 px-3 text-white text-xs focus:outline-none focus:border-[#00FF00] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-white/40 tracking-widest uppercase mb-1.5" htmlFor="text-color-picker">
                        Text Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="text-color-picker"
                          type="color"
                          value={selectedElement.color || '#ffffff'}
                          onChange={(e) => updateSelectedElement({ color: e.target.value })}
                          className="w-8 h-8 bg-transparent border-0 rounded-none cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={selectedElement.color || '#ffffff'}
                          onChange={(e) => updateSelectedElement({ color: e.target.value })}
                          className="w-full bg-black border-2 border-white/20 rounded-none px-2 text-white font-mono text-xs focus:outline-none focus:border-[#00FF00] transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Alignment buttons */}
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 tracking-widest uppercase mb-1.5">
                      Text Alignment
                    </label>
                    <div className="grid grid-cols-3 gap-2 p-1 bg-black border-2 border-white/20 rounded-none">
                      <button
                        type="button"
                        onClick={() => updateSelectedElement({ align: 'left' })}
                        className={`py-1 rounded-none flex items-center justify-center text-xs transition ${selectedElement.align === 'left' ? 'bg-[#00FF00] text-black font-extrabold' : 'text-white/40 hover:text-white'}`}
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSelectedElement({ align: 'center' })}
                        className={`py-1 rounded-none flex items-center justify-center text-xs transition ${selectedElement.align === 'center' || !selectedElement.align ? 'bg-[#00FF00] text-black font-extrabold' : 'text-white/40 hover:text-white'}`}
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSelectedElement({ align: 'right' })}
                        className={`py-1 rounded-none flex items-center justify-center text-xs transition ${selectedElement.align === 'right' ? 'bg-[#00FF00] text-black font-extrabold' : 'text-white/40 hover:text-white'}`}
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Font weight */}
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 tracking-widest uppercase mb-1.5">
                      Font Weight
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-black border-2 border-white/20 rounded-none">
                      <button
                        type="button"
                        onClick={() => updateSelectedElement({ fontWeight: 'normal' })}
                        className={`py-1 text-xs rounded-none transition uppercase font-bold ${selectedElement.fontWeight === 'normal' ? 'bg-[#00FF00] text-black' : 'text-white/40 hover:text-white'}`}
                      >
                        Regular
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSelectedElement({ fontWeight: 'bold' })}
                        className={`py-1 text-xs rounded-none transition uppercase font-bold ${selectedElement.fontWeight === 'bold' || selectedElement.fontWeight === undefined ? 'bg-[#00FF00] text-black' : 'text-white/40 hover:text-white'}`}
                      >
                        Bold
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. QR Code Elements */}
              {selectedElement.type === 'qr' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 tracking-widest uppercase mb-1.5" htmlFor="qr-target-select">
                      QR Target Action Link
                    </label>
                    <select
                      id="qr-target-select"
                      value={selectedElement.qrTarget || 'event'}
                      onChange={(e) => updateSelectedElement({ qrTarget: e.target.value as QRTargetType })}
                      className="w-full bg-black border-2 border-white/20 rounded-none py-2 px-3 text-white text-xs focus:outline-none focus:border-[#00FF00] transition uppercase"
                    >
                      <option value="event">This Event Page URL</option>
                      <option value="registration">rsvp link</option>
                      <option value="verification">verification check</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-white/40 leading-relaxed uppercase">
                    Generates a scannable QR Code on each output pass pointing to the configured destination link to simplify credential scanning.
                  </p>
                </div>
              )}

              {/* Delete Selector */}
              <div className="pt-6 border-t border-white/10">
                <button
                  type="button"
                  id={`delete-selected-element-${selectedElementId}`}
                  onClick={() => deleteElement(selectedElementId)}
                  className="w-full bg-black border-2 border-red-500/40 hover:bg-red-500 hover:text-black text-red-400 py-2 rounded-none flex items-center justify-center gap-2 text-xs transition uppercase tracking-wider font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Selected Overlay
                </button>
              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-white/40 flex-1 flex flex-col items-center justify-center font-mono">
              <Plus className="w-8 h-8 text-white/20 mb-3" />
              <p className="text-xs font-bold text-white uppercase tracking-wider">No layer selected</p>
              <p className="text-[10px] uppercase mt-1 leading-relaxed">
                Click any layer on the preview canvas or append a new one from the left sidebar panel to edit its parameters.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
