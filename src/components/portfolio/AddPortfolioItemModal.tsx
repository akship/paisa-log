"use client";

import { useState, useEffect } from "react";
import { Plus, X, Landmark, TrendingUp, HandCoins, CreditCard } from "lucide-react";
import { addPortfolioItem, updatePortfolioItem, PortfolioItem, PortfolioCategoryGroup } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/auth";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { BASE_PORTFOLIO_CATEGORIES } from "@/lib/constants";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: PortfolioItem | null;
}

const CATEGORY_GROUPS = [
  { id: "LIQUID", label: "Liquid Assets", icon: Landmark, color: "text-blue-400" },
  { id: "INVESTMENTS", label: "Investments", icon: TrendingUp, color: "text-green-400" },
  { id: "RECEIVABLES", label: "Receivables", icon: HandCoins, color: "text-purple-400" },
  { id: "LIABILITIES", label: "Liabilities", icon: CreditCard, color: "text-red-400" },
] as const;

export default function AddPortfolioItemModal({ isOpen, onClose, initialData }: Props) {
  const { user, preferences, encryptionKey } = useAuth();
  useScrollLock(isOpen);
  
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryGroup, setCategoryGroup] = useState<PortfolioCategoryGroup>("INVESTMENTS");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Synchronize with initialData or reset on open
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setAmount(initialData.amount.toString());
      setCategoryGroup(initialData.categoryGroup);
      setCategory(initialData.category);
    } else if (isOpen) {
      setName("");
      setAmount("");
      setCategoryGroup("INVESTMENTS");
      // Category will be set by the next useEffect
    }
  }, [initialData, isOpen]);

  // Handle Dynamic Categories
  const availableCategories = preferences?.portfolioCategories?.[categoryGroup] || BASE_PORTFOLIO_CATEGORIES[categoryGroup];

  useEffect(() => {
    if (isOpen && availableCategories && availableCategories.length > 0) {
      // Only reset category if it's not in the new available list or if we're not editing
      if (!availableCategories.includes(category)) {
        setCategory(availableCategories[0]);
      }
    }
  }, [categoryGroup, availableCategories, isOpen, category]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !name || isNaN(Number(amount))) return;
    
    setLoading(true);
    const numAmount = Math.floor(Number(amount));

    try {
      if (!initialData) {
        await addPortfolioItem({
          user_id: user.uid,
          name,
          categoryGroup,
          category: categoryGroup, // Use group as default category
          amount: numAmount,
          timestamp: new Date()
        }, encryptionKey);
      } else if (initialData.id) {
        await updatePortfolioItem(initialData.id, {
          name,
          categoryGroup,
          category: categoryGroup, // Use group as default category
          amount: numAmount,
          timestamp: new Date() // Update last modified
        }, encryptionKey);
      }
      onClose();
    } catch (error: any) {
      console.error("Error saving portfolio item:", error);
      alert("Failed to save: " + error.message);
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
      
      {/* Modal Shell */}
      <div className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-[#0c1222]/90 border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] backdrop-blur-[60px] transition-all transform animate-in fade-in zoom-in-95 slide-in-from-top-10 duration-500 mb-10">
        
        {/* Prismatic Shine Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <div className="absolute top-[-100%] left-[-100%] w-[300%] h-[300%] bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2 relative z-10">
          <div>
            <h2 className="text-xl font-bold font-display tracking-tight text-on-surface">
              {initialData ? "Refine" : "New"} <span className="text-secondary italic">Asset</span>
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40 mt-0.5">Portfolio</p>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-2xl p-2.5 bg-white/5 text-on-surface-variant hover:text-white hover:bg-white/10 transition-all border border-white/5 active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-8 pt-2 relative z-10">
          <div className="space-y-6">
            {/* Group Toggle */}
            <div>
              <label className="block text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em] mb-3 ml-1">Classification</label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORY_GROUPS.map((group) => {
                  const Icon = group.icon;
                  const isActive = categoryGroup === group.id;
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setCategoryGroup(group.id as PortfolioCategoryGroup)}
                      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-2.5 transition-all duration-500 ${
                        isActive 
                        ? "border-secondary/50 bg-secondary/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
                        : "border-white/5 bg-white/[0.02] text-on-surface-variant/40 hover:border-white/10 hover:bg-white/[0.05]"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isActive ? "text-secondary scale-110" : "opacity-60"}`} />
                        {group.id === "INVESTMENTS" ? "Invest" : group.id === "RECEIVABLES" ? "Receiv" : group.id === "LIABILITIES" ? "Liabil" : "Liquid"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Asset Name */}
            <div>
              <label className="block text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em] mb-2 ml-1">Identity</label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/5 px-4 py-3.5 text-xs font-bold text-on-surface placeholder:text-on-surface-variant/20 focus:outline-none focus:border-secondary/20 focus:bg-white/[0.04] transition-all rounded-2xl"
                placeholder="e.g. HDFC Bank, BTC"
              />
            </div>

            {/* Amount - High Visual Weight */}
            <div className="relative group">
              <label className="block text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em] mb-2 ml-1">Value</label>
              <div className="relative flex items-center">
                <span className="absolute left-0 text-secondary/40 font-display text-2xl font-light">₹</span>
                <input
                  type="number"
                  step="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-white/10 pl-8 pr-4 py-3 text-4xl font-display font-black text-on-surface placeholder:text-white/[0.02] focus:outline-none focus:border-secondary/50 transition-all rounded-none selection:bg-secondary/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
                <div className="absolute left-8 right-0 bottom-0 h-[1px] bg-secondary w-0 group-focus-within:w-[calc(100%-32px)] transition-all duration-1000 ease-out" />
              </div>
            </div>
          </div>

          {/* Submit Trigger */}
          <button
            type="submit"
            disabled={loading || !amount || !name}
            className="mt-10 w-full flex items-center justify-center gap-2.5 rounded-[1.25rem] bg-secondary/10 border border-secondary/20 px-6 py-4.5 text-[10px] font-black uppercase tracking-[0.3em] text-secondary hover:bg-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 disabled:opacity-20 disabled:grayscale disabled:scale-100 relative group/btn overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-secondary/5 group-hover/btn:bg-secondary/10 transition-colors" />
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-secondary"></div>
            ) : (
              <>
                <Plus className="h-4 w-4 stroke-[3px]" />
                {initialData ? "Apply Refinement" : "Secure Asset"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
