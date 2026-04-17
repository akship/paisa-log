"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";
import { useScrollLock } from "@/lib/hooks/useScrollLock";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  loading?: boolean;
}

export default function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Delete Transaction?", 
  description = "This action cannot be undone. This will permanently remove the record from your history.",
  loading = false
}: Props) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useScrollLock(isOpen);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 overflow-y-auto pt-20">
      {/* Dynamic Backdrop */}
      <div 
        className="fixed inset-0 bg-[#060912]/85 backdrop-blur-xl transition-opacity duration-500"
        onClick={onClose}
      />
      
      {/* Modal Shell */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-[#0c1222]/90 border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] backdrop-blur-[60px] p-6 text-center transition-all transform animate-in zoom-in-95 fade-in duration-300">
        
        <div className="bg-tertiary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 ring-1 ring-tertiary/20">
          <AlertTriangle className="h-8 w-8 text-tertiary" />
        </div>

        <h2 className="text-xl font-bold text-on-surface mb-2 font-display tracking-tight">{title}</h2>
        <p className="text-on-surface-variant/60 text-[11px] mb-8 leading-relaxed px-4">
          {description}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full bg-tertiary/10 border border-tertiary/20 hover:bg-tertiary/20 text-tertiary font-black uppercase tracking-[0.2em] text-[10px] py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Confirm Deletion"}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full bg-white/5 border border-white/5 hover:bg-white/10 text-on-surface-variant font-black uppercase tracking-[0.2em] text-[10px] py-4 rounded-2xl transition-all active:scale-95"
          >
            Keep Record
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
