"use client";

import { Plus } from "lucide-react";

interface PageLoadingProps {
  loading: boolean;
  error: string | null;
  isWarning?: boolean;
  onBypass?: () => void;
  message?: string;
  errorReload?: () => void;
}

export default function PageLoading({
  loading,
  error,
  isWarning,
  onBypass,
  message = "Syncing with cloud...",
  errorReload = () => window.location.reload(),
}: PageLoadingProps) {
  if (loading) {
    return (
      <div className="w-full space-y-8 animate-pulse p-4 md:p-0">
        {/* Skeleton Header */}
        <div className="h-16 w-1/3 bg-white/[0.03] rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent skeleton-shimmer" />
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 glass-card rounded-3xl border border-white/5 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent skeleton-shimmer" />
            </div>
          ))}
        </div>

        {/* Skeleton Main View */}
        <div className="h-[400px] glass-card rounded-[40px] border border-white/5 relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent skeleton-shimmer" />
           <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/[0.03] border border-white/5 animate-spin flex items-center justify-center">
                 <div className="h-1 w-1 rounded-full bg-primary shadow-glow-primary" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">{message}</p>
           </div>
        </div>

        <style jsx>{`
          .skeleton-shimmer {
            animation: shimmer 2s infinite linear;
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="glass-card p-10 max-w-md w-full border-red-500/20 text-center">
          <div className="bg-red-500/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-6">
            <Plus className="h-6 w-6 text-red-500 rotate-45" />
          </div>
          <h2 className="text-2xl font-bold mb-3 font-display tracking-tight text-white uppercase italic">System Error</h2>
          <p className="text-on-surface-variant text-[11px] font-medium mb-8 leading-relaxed uppercase tracking-wider opacity-60">
            {error.includes("index")
              ? "The database requires an optimization index. This usually takes a few minutes to build. Please try again soon."
              : error}
          </p>
          <button
            onClick={errorReload}
            className="w-full bg-white text-background px-6 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all hover:scale-[1.02] active:scale-95 shadow-glow-white/10"
          >
            Reconnect System
          </button>
        </div>
      </div>
    );
  }

  return null;
}
