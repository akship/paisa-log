"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Plus, X, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { addTransaction, updateTransaction, checkDuplicateTransaction, Transaction } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/auth";
import { useData } from "@/lib/DataContext";
import { useScrollLock } from "@/lib/hooks/useScrollLock";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Transaction | null;
}

// Module-level variable to persist across modal opens/closes without refreshing the page
let lastDate = new Date().toISOString().split('T')[0];

export default function AddTransactionModal({ isOpen, onClose, initialData }: Props) {
  const { user, preferences, encryptionKey } = useAuth();
  const [mounted, setMounted] = useState(false);
  useScrollLock(isOpen);
  
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => lastDate);
  
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{desc: string, cat: string}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { transactions, categories: dataCategories } = useData();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Derive Sorted Categories from DataContext
  const sortedCategories = useMemo(() => {
    const list = type === "expense" ? dataCategories.expense : dataCategories.income;
    const sorted = [...list];

    // Ensure initialData category is present even if disabled
    if (initialData && initialData.type === type && !sorted.includes(initialData.category)) {
      sorted.push(initialData.category);
    }

    return sorted;
  }, [dataCategories, type, initialData]);

  // Set default category when type changes or categories load
  useEffect(() => {
    if (isOpen && sortedCategories.length > 0 && !category) {
      if (initialData && initialData.type === type) {
        setCategory(initialData.category);
      } else {
        setCategory(sortedCategories[0]);
      }
    }
  }, [isOpen, sortedCategories, type, initialData, category]);

  // Pre-fill if editing
  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setCategory(initialData.category);
      setDescription(initialData.description || "");
      setDate(new Date(initialData.timestamp).toISOString().split('T')[0]);
    } else if (isOpen) {
      setType("expense");
      setAmount("");
      setDescription("");
      setDate(lastDate);
      // Category will be set by the other useEffect
    }
  }, [initialData, isOpen]);

  // Generate suggestions from transactions history
  useEffect(() => {
    if (isOpen) {
      const uniqueDescriptions = new Set<string>();
      const sugg: { desc: string, cat: string }[] = [];
      
      // Filter transactions by current type for domain-specific suggestions
      const relevantTransactions = transactions.filter(t => t.type === type);
      
      for (const tx of relevantTransactions) {
        if (!tx.description || tx.description === "[Locked Data]") continue;
        const normalizedDesc = tx.description.trim().toLowerCase();
        if (!uniqueDescriptions.has(normalizedDesc)) {
          uniqueDescriptions.add(normalizedDesc);
          sugg.push({ desc: tx.description, cat: tx.category });
        }
        if (sugg.length >= 200) break; // Limit
      }
      setSuggestions(sugg);
    }
  }, [isOpen, transactions, type]);

  if (!isOpen || !mounted) return null;

  const filteredSuggestions = suggestions.filter(s => 
    s.desc.toLowerCase().includes(description.toLowerCase()) && s.desc !== description
  ).slice(0, 5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || isNaN(Number(amount))) return;
    
    setLoading(true);
    const numAmount = Math.floor(Number(amount));
    const txDate = new Date(date);

    try {
      if (!initialData) {
        // Duplicate Check only for new entries
        const isDuplicate = await checkDuplicateTransaction(user.uid, numAmount, txDate, category, description, encryptionKey);
        if (isDuplicate) {
          if (!window.confirm(`A transaction for ${formatINR(numAmount)} was already logged today. Proceed anyway?`)) {
            setLoading(false);
            return;
          }
        }

        await addTransaction({
          user_id: user.uid,
          type,
          amount: numAmount,
          category,
          description,
          timestamp: txDate
        }, encryptionKey);
      } else if (initialData.id) {
        await updateTransaction(initialData.id, {
          type,
          amount: numAmount,
          category,
          description,
          timestamp: txDate
        }, encryptionKey);
      }
      
      onClose();
    } catch (error: any) {
      console.error("Error saving transaction:", error);
      alert("Failed to save transaction: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 overflow-y-auto pt-10 sm:pt-20">
      {/* Dynamic Backdrop */}
      <div 
        className="fixed inset-0 bg-[#060912]/85 backdrop-blur-xl transition-opacity duration-500"
        onClick={onClose}
      />
      
      {/* Main Glass Shell */}
      <div className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-[#0c1222]/90 border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] backdrop-blur-[60px] transition-all transform animate-in fade-in zoom-in-95 slide-in-from-top-10 duration-500 mb-10">
        
        {/* Prismatic Shine Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <div className="absolute top-[-100%] left-[-100%] w-[300%] h-[300%] bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>

        {/* Subtle Visual Ornaments */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-38 h-38 bg-secondary/5 rounded-full blur-[60px] pointer-events-none" />

        {/* Header Unit */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2 relative z-10">
          <div>
            <h2 className="text-xl font-bold font-display tracking-tight text-on-surface">
              {initialData ? "Refine" : "New"} <span className="text-primary italic">Record</span>
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40 mt-0.5">Details</p>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-2xl p-2.5 bg-white/5 text-on-surface-variant hover:text-white hover:bg-white/10 transition-all border border-white/5 active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-8 pt-2 relative z-10">
          {/* Prism Mode Selector */}
          <div className="grid grid-cols-2 rounded-2xl bg-white/[0.03] p-1.5 mb-6 border border-white/5 relative">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`flex items-center justify-center gap-2.5 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-500 relative overflow-hidden ${
                type === "expense" 
                ? "bg-white/10 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] border border-white/10" 
                : "text-on-surface-variant/40 hover:text-on-surface hover:bg-white/5 border border-transparent"
              }`}
            >
              {type === "expense" && <div className="absolute inset-0 bg-tertiary/10 animate-pulse" />}
              <ArrowUpRight className={`h-3.5 w-3.5 stroke-[3px] transition-colors ${type === "expense" ? "text-tertiary" : ""}`} /> Expense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`flex items-center justify-center gap-2.5 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-500 relative overflow-hidden ${
                type === "income" 
                ? "bg-white/10 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] border border-white/10" 
                : "text-on-surface-variant/40 hover:text-on-surface hover:bg-white/5 border border-transparent"
              }`}
            >
              {type === "income" && <div className="absolute inset-0 bg-secondary/10 animate-pulse" />}
              <ArrowDownRight className={`h-3.5 w-3.5 stroke-[3px] transition-colors ${type === "income" ? "text-secondary" : ""}`} /> Inflow
            </button>
          </div>

          <div className="space-y-5">
            {/* Amount Field - High Visual Weight */}
            <div className="relative group">
              <label className="block text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em] mb-2 ml-1">Value</label>
              <div className="relative flex items-center">
                <span className="absolute left-0 text-primary/40 font-display text-2xl font-light">₹</span>
                <input
                  type="number"
                  step="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-white/10 pl-8 pr-4 py-3 text-4xl font-display font-black text-on-surface placeholder:text-white/[0.02] focus:outline-none focus:border-primary/50 transition-all rounded-none selection:bg-primary/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                  autoFocus
                />
                <div className="absolute left-8 right-0 bottom-0 h-[1px] bg-primary w-0 group-focus-within:w-[calc(100%-32px)] transition-all duration-1000 ease-out" />
              </div>
            </div>

            {/* Description - Smart Input */}
            <div className="relative">
              <label className="block text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em] mb-2 ml-1">Memo</label>
              <div className="relative">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full bg-white/[0.02] border border-white/5 px-4 py-3.5 text-xs font-bold text-on-surface placeholder:text-on-surface-variant/20 focus:outline-none focus:border-primary/20 focus:bg-white/[0.04] transition-all rounded-2xl"
                  placeholder="What was this for?"
                />
                
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-[#0c1222]/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl">
                    {filteredSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onMouseDown={(e) => {
                          // Prevent input blur before this click finishes
                          e.preventDefault();
                          setDescription(s.desc);
                          setCategory(s.cat);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-5 py-4 text-[10px] font-bold text-on-surface-variant hover:text-white hover:bg-primary/10 transition-all border-b border-white/5 last:border-0 uppercase tracking-widest flex items-center justify-between"
                      >
                        <span>{s.desc}</span>
                        <span className="text-[8px] opacity-40">{s.cat}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category Selector */}
              <div>
                <label className="block text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em] mb-2 ml-1">Tag</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-2xl bg-white/[0.02] border border-white/5 px-4 py-3.5 text-[10px] font-bold uppercase tracking-widest text-on-surface focus:outline-none focus:border-primary/20 focus:bg-white/[0.04] transition-all appearance-none cursor-pointer"
                  >
                    {sortedCategories.map(c => <option key={c} value={c} className="bg-[#060912]">{c}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                    <Plus className="h-3 w-3 rotate-45" />
                  </div>
                </div>
              </div>

              {/* Precise Date */}
              <div>
                <label className="block text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em] mb-2 ml-1">Timeline</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    lastDate = e.target.value;
                  }}
                  className="w-full rounded-2xl bg-white/[0.02] border border-white/5 px-4 py-3.5 text-[10px] font-bold uppercase tracking-widest text-on-surface focus:outline-none focus:border-primary/20 focus:bg-white/[0.04] transition-all [color-scheme:dark] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Prism Trigger */}
          <button
            type="submit"
            disabled={loading || !amount}
            className="mt-8 w-full flex items-center justify-center gap-2.5 rounded-[1.25rem] bg-primary/10 border border-primary/20 px-6 py-4.5 text-[10px] font-black uppercase tracking-[0.3em] text-primary hover:bg-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 disabled:opacity-20 disabled:grayscale disabled:scale-100 relative group/btn overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-primary/5 group-hover/btn:bg-primary/10 transition-colors" />
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
            ) : (
              <>
                {initialData ? <Plus className="h-4 w-4 rotate-45 stroke-[3px]" /> : <Plus className="h-4 w-4 stroke-[3px]" />}
                {initialData ? "Apply Changes" : "Log Record"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
