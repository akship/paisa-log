"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, CheckCircle2 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useScrollLock } from "@/lib/hooks/useScrollLock";

interface CustomDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;
  onApply: () => void;
}

export default function CustomDateModal({
  isOpen,
  onClose,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onApply
}: CustomDateModalProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useScrollLock(isOpen);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-xl animate-in fade-in duration-500"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-[#0c1222]/90 border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] backdrop-blur-[60px] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        
        {/* Prismatic Shine Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <div className="absolute top-[-100%] left-[-100%] w-[300%] h-[300%] bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4 relative z-10">
          <div>
            <h2 className="text-xl font-bold font-display tracking-tight text-white">
              Custom <span className="text-primary italic">Range</span>
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mt-0.5 whitespace-nowrap">Select Timeline</p>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-2xl p-2.5 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/5 active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Date Selection */}
        <div className="px-8 pb-10 pt-2 relative z-10 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">From</label>
              <div className="relative flex items-center p-4 bg-white/[0.03] border border-white/5 rounded-2xl group active:scale-[0.98] transition-all">
                <Calendar className="h-4 w-4 text-primary opacity-40 mr-3" />
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  className="bg-transparent border-none text-[12px] font-black text-white focus:outline-none cursor-pointer w-full"
                  dateFormat="MMMM d, yyyy"
                  placeholderText="Start Date"
                  popperClassName="themed-datepicker"
                  popperPlacement="bottom-start"
                  portalId="datepicker-portal"
                />
              </div>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Until</label>
              <div className="relative flex items-center p-4 bg-white/[0.03] border border-white/5 rounded-2xl group active:scale-[0.98] transition-all">
                <Calendar className="h-4 w-4 text-primary opacity-40 mr-3" />
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate || undefined}
                  className="bg-transparent border-none text-[12px] font-black text-white focus:outline-none cursor-pointer w-full"
                  dateFormat="MMMM d, yyyy"
                  placeholderText="End Date"
                  popperClassName="themed-datepicker"
                  popperPlacement="bottom-start"
                  portalId="datepicker-portal"
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onApply}
            className="w-full flex items-center justify-center gap-3 rounded-[1.25rem] bg-primary text-background px-6 py-5 text-[11px] font-black uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 shadow-glow-primary relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CheckCircle2 className="h-4 w-4 stroke-[3px]" />
            Apply Selection
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
