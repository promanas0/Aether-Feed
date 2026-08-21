import React from 'react';
import { Plus } from 'lucide-react';

interface FABProps {
  onClick: () => void;
}

export const FloatingActionButton: React.FC<FABProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      id="floating-create-post-btn"
      aria-label="Create Post"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-full shadow-glow transition-all duration-200 hover:scale-105 active:scale-95 border border-blue-400/30 group"
    >
      <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
      <span className="hidden sm:inline font-medium tracking-wide">Create Post</span>
    </button>
  );
};
