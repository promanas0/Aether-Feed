import React from 'react';
import { X, ExternalLink, Download } from 'lucide-react';

interface LightboxProps {
  isOpen: boolean;
  imageUrl: string;
  title: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<LightboxProps> = ({
  isOpen,
  imageUrl,
  title,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative max-w-5xl w-full max-h-[95vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between p-3 text-white mb-2">
          <h3 className="text-sm font-semibold truncate pr-4 text-slate-200">{title}</h3>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-[#1E293B] hover:bg-[#334155] rounded-xl text-slate-300 hover:text-white transition-colors"
              title="Open full image in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 bg-[#1E293B] hover:bg-[#334155] rounded-xl text-slate-300 hover:text-white transition-colors"
              aria-label="Close lightbox"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Box */}
        <div className="rounded-2xl overflow-hidden border border-[#334155] bg-[#0B132B] shadow-2xl max-h-[82vh] flex items-center justify-center">
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[82vh] max-w-full w-auto h-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
};
