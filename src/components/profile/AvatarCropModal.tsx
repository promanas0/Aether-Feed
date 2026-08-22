import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Move, 
  Check, 
  Sparkles,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { DLICOM_DEFAULT_AVATARS } from '../../lib/storage';

interface AvatarCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setSelectedPreset(null);
    }
  }, [isOpen, imageSrc]);

  if (!isOpen) return null;

  // Mouse / Touch Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  // Perform Canvas Render & Export
  const handleApply = () => {
    if (selectedPreset) {
      onCropComplete(selectedPreset);
      onClose();
      return;
    }

    const img = imgRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);
    ctx.save();

    // Center of canvas
    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Scaling ratio from viewport (approx 240px) to output (400px)
    const scaleRatio = size / 240;
    ctx.translate(offset.x * scaleRatio, offset.y * scaleRatio);

    // Draw image centered
    const aspect = img.naturalWidth / img.naturalHeight;
    let drawWidth = size;
    let drawHeight = size;

    if (aspect > 1) {
      drawHeight = size;
      drawWidth = size * aspect;
    } else {
      drawWidth = size;
      drawHeight = size / aspect;
    }

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    const result = canvas.toDataURL('image/jpeg', 0.9);
    onCropComplete(result);
    onClose();
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070D1F]/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-[#1C2541] border border-[#334155] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#334155] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Move className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Adjust Profile Picture
              </h3>
              <p className="text-[11px] text-slate-400">
                Pan, zoom, or choose official Dlicom character
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-[#0B132B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport / Interactive Crop Box */}
        <div className="p-6 flex flex-col items-center bg-[#0B132B]">
          
          <div 
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            className="relative w-60 h-60 rounded-full border-4 border-blue-500/80 shadow-[0_0_30px_rgba(59,130,246,0.3)] overflow-hidden cursor-grab active:cursor-grabbing select-none flex items-center justify-center bg-slate-950"
          >
            {/* Guide overlay */}
            <div className="absolute inset-0 pointer-events-none rounded-full border border-white/20 z-10" />

            <img
              ref={imgRef}
              src={selectedPreset || imageSrc}
              alt="Avatar preview"
              draggable={false}
              style={{
                transform: selectedPreset ? 'none' : `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'cover',
              }}
              className="select-none pointer-events-none"
            />
          </div>

          <p className="text-[11px] text-slate-400 mt-3 font-mono">
            Drag to reposition &bull; Scroll slider to zoom
          </p>
        </div>

        {/* Controls */}
        <div className="p-5 space-y-4 bg-[#1C2541]">
          
          {/* Zoom Slider */}
          {!selectedPreset && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-blue-400" />
                  <span>Scale / Zoom</span>
                </span>
                <span className="font-mono text-blue-400">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.max(0.8, z - 0.1))}
                  className="p-1.5 bg-[#0B132B] hover:bg-[#2A3756] border border-[#334155] rounded-lg text-slate-300 cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min="0.8"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-blue-500 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.min(3, z + 0.1))}
                  className="p-1.5 bg-[#0B132B] hover:bg-[#2A3756] border border-[#334155] rounded-lg text-slate-300 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRotation(r => (r + 90) % 360)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#0B132B] hover:bg-[#2A3756] border border-[#334155] rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotate</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOffset({ x: 0, y: 0 });
                setZoom(1);
                setRotation(0);
                setSelectedPreset(null);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#0B132B] hover:bg-[#2A3756] border border-[#334155] rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Center / Reset</span>
            </button>
          </div>

          {/* Official Dlicom Mascot Characters Selection */}
          <div className="pt-2 border-t border-[#334155]/60 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Or Select Official Dlicom Character</span>
            </p>
            
            <div className="grid grid-cols-3 gap-2">
              {DLICOM_DEFAULT_AVATARS.map((avatarUrl, idx) => (
                <button
                  key={avatarUrl}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(avatarUrl);
                    setOffset({ x: 0, y: 0 });
                    setZoom(1);
                  }}
                  className={`p-1 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    selectedPreset === avatarUrl
                      ? 'border-blue-500 bg-blue-600/20 shadow-glow-sm'
                      : 'border-[#334155] bg-[#0B132B] hover:border-slate-500'
                  }`}
                >
                  <img
                    src={avatarUrl}
                    alt={`Dlicom Character ${idx + 1}`}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <span className="text-[10px] font-semibold text-slate-300">
                    Dlicom #{idx + 1}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Save / Apply Button */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-[#0B132B] hover:bg-[#2A3756] border border-[#334155] rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="flex-2 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-glow transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply Profile Picture</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
