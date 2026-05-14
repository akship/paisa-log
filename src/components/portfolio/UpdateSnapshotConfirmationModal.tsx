"use client";

import { useState, useEffect } from "react";
import { X, RefreshCw, AlertCircle, ArrowRight } from "lucide-react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { formatINR } from "@/lib/utils";
import { PortfolioSnapshot } from "@/lib/firebase/firestore";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  currentValues: {
    netWorth: number;
    liquid: number;
    investments: number;
    receivables: number;
    liabilities: number;
  };
  latestSnapshot: PortfolioSnapshot | null;
  loading: boolean;
}

export default function UpdateSnapshotConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  currentValues, 
  latestSnapshot,
  loading 
}: Props) {
  useScrollLock(isOpen);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || !latestSnapshot) return null;

  const metrics = [
    { label: "Net Worth", current: currentValues.netWorth, stored: latestSnapshot.totalNetWorth, color: "text-blue-400" },
    { label: "Liquid", current: currentValues.liquid, stored: latestSnapshot.liquid, color: "text-emerald-400" },
    { label: "Investments", current: currentValues.investments, stored: latestSnapshot.investments, color: "text-amber-400" },
    { label: "Receivables", current: currentValues.receivables, stored: latestSnapshot.receivables, color: "text-indigo-400" },
    { label: "Liabilities", current: currentValues.liabilities, stored: latestSnapshot.liabilities, color: "text-rose-400" },
  ].filter(m => m.current !== m.stored);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 overflow-y-auto pt-10 sm:pt-20">
      <div 
        className="fixed inset-0 bg-background/85 backdrop-blur-xl transition-opacity duration-500"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-surface-container/90 border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] backdrop-blur-[60px] transition-all transform animate-in fade-in zoom-in-95 slide-in-from-top-10 duration-500 mb-10">
        
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <div className="absolute top-[-100%] left-[-100%] w-[300%] h-[300%] bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>

        <div className="flex items-center justify-between px-8 pt-8 pb-4 relative z-10">
          <div>
            <h2 className="text-2xl font-bold font-display tracking-tight text-on-surface flex items-center gap-3">
              <RefreshCw className="h-6 w-6 text-blue-400" />
              Update <span className="text-blue-400 italic">Snapshot</span>
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40 mt-1">Refine Historical Record</p>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-2xl p-2.5 bg-white/5 text-on-surface-variant hover:text-white hover:bg-white/10 transition-all border border-white/5 active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-8 pb-8 pt-4 relative z-10">
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 mb-8 flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-[11px] font-medium text-rose-200/70 leading-relaxed">
              This will overwrite the values in your latest snapshot with your current live portfolio data. 
              The original timestamp will also be updated to the current time.
            </p>
          </div>

          <div className="space-y-4">
            {metrics.length > 0 ? (
              <>
                <div className="grid grid-cols-12 px-4 mb-2">
                  <div className="col-span-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Metric</div>
                  <div className="col-span-3 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Stored</div>
                  <div className="col-span-1"></div>
                  <div className="col-span-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em] text-right">Current</div>
                </div>

                <div className="space-y-2">
                  {metrics.map((m) => {
                    const diff = m.current - m.stored;
                    const isPositive = diff > 0;
                    
                    return (
                      <div key={m.label} className="grid grid-cols-12 items-center bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-4 group hover:bg-white/[0.04] transition-all">
                        <div className="col-span-4">
                          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover:text-white/60 transition-colors">{m.label}</span>
                        </div>
                        <div className="col-span-3">
                          <span className="text-xs font-bold text-white/30 tabular-nums">{formatINR(m.stored)}</span>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <ArrowRight className="h-3 w-3 text-white/10" />
                        </div>
                        <div className="col-span-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className={`text-sm font-black tabular-nums ${m.color}`}>{formatINR(m.current)}</span>
                            <span className={`text-[9px] font-black tabular-nums mt-0.5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isPositive ? '+' : ''}{formatINR(diff)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 bg-white/[0.01] border border-dashed border-white/10 rounded-[2rem]">
                <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <RefreshCw className="h-5 w-5 text-white/20" />
                </div>
                <h3 className="text-sm font-bold text-white/60">No adjustments required</h3>
                <p className="text-[10px] text-white/20 uppercase tracking-widest mt-1 text-center">Your latest snapshot is already synchronized with live data.</p>
              </div>
            )}
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:bg-white/10 hover:text-white transition-all"
            >
              {metrics.length > 0 ? "Cancel" : "Close"}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading || metrics.length === 0}
              className="flex items-center justify-center gap-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 hover:bg-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 disabled:opacity-20 relative group/btn overflow-hidden"
            >
              <div className="absolute inset-0 bg-blue-500/5 group-hover/btn:bg-blue-500/10 transition-colors" />
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-400"></div>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Confirm Update
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
