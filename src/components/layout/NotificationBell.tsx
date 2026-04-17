"use client";

import { useState } from "react";
import { useData } from "@/lib/DataContext";
import { Bell, Camera, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function NotificationBell() {
  const { portfolioItems: items, portfolioHistory: history } = useData();
  const [isOpen, setIsOpen] = useState(false);

  const currentMonthYear = format(new Date(), "yyyy-MM");
  const hasSnapshotThisMonth = history.some(s => s.monthYear === currentMonthYear);
  const needsSnapshot = !hasSnapshotThisMonth && items.length > 0;

  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-full flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all relative group"
      >
        <Bell className={`h-5 w-5 ${needsSnapshot ? "text-rose-500 animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]" : "text-white/40 group-hover:text-white/60"}`} />
        {needsSnapshot && (
          <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-1/2 -translate-x-1/2 mt-4 w-72 max-w-[calc(100vw-2rem)] z-50 glass-card p-2 rounded-2xl border-white/10 shadow-2xl bg-[#060912] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 origin-top">
            <div className="p-4 border-b border-white/5 mb-2">
              <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">Action Required</h3>
            </div>
            
            {needsSnapshot ? (
              <Link 
                href="/portfolio" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.05] transition-all group"
              >
                <div className="h-10 w-10 shrink-0 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                  <Camera className="h-5 w-5 text-rose-500" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-black text-white uppercase tracking-wider mb-0.5">Snapshot Reminder</p>
                  <p className="text-[10px] font-medium text-white/30 leading-tight">Log your portfolio values for {format(new Date(), "MMMM")}.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-white/10 group-hover:text-rose-500 transition-colors" />
              </Link>
            ) : (
              <div className="p-8 text-center uppercase">
                 <p className="text-[9px] font-black text-white/20 tracking-[0.4em]">All caught up</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
