import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingFallback = ({ fullScreen = false }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={
        fullScreen
          ? 'fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm'
          : 'w-full min-h-[400px] flex items-center justify-center'
      }
    >
      <div className="flex flex-col items-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
        <h2 className="text-sm font-bold text-slate-800">Loading Workspace</h2>
        <p className="text-xs text-slate-500 mt-1">Please wait a moment...</p>
      </div>
    </div>
  );
};

export default LoadingFallback;
