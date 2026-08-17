"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="relative w-full max-w-md glass-card rounded-[2.5rem] border border-white/10 p-8 md:p-12 shadow-2xl bg-surface-container/95 backdrop-blur-[60px] text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-2xl">
          <AlertCircle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-black font-display tracking-tight text-white">
            System Interruption
          </h1>
          <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs mx-auto">
            An unexpected error occurred while processing your financial session.
          </p>
        </div>

        {error.message && (
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-left max-h-32 overflow-y-auto custom-scrollbar">
            <p className="text-[10px] font-mono text-rose-400/80 break-words">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-primary text-black font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-glow-primary cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-white/5 text-white/70 font-black uppercase text-[10px] tracking-widest hover:bg-white/10 hover:text-white transition-all border border-white/5 cursor-pointer"
          >
            <Home className="h-4 w-4" />
            Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
