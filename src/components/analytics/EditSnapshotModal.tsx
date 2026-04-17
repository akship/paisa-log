"use client";

import { useState, useEffect } from "react";
import { PortfolioSnapshot, PortfolioSnapshotItem, savePortfolioSnapshot } from "@/lib/firebase/firestore";
import { formatINR } from "@/lib/utils";
import { X, Save, Plus, Trash2, ChevronDown, ChevronUp, Calculator } from "lucide-react";
import { toast } from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  snapshot: PortfolioSnapshot | null;
  encryptionKey: CryptoKey | null;
}

export default function EditSnapshotModal({ isOpen, onClose, snapshot, encryptionKey }: Props) {
  const [items, setItems] = useState<Record<string, PortfolioSnapshotItem[]>>({
    LIQUID: [],
    INVESTMENTS: [],
    RECEIVABLES: [],
    LIABILITIES: []
  });
  
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (snapshot) {
      setItems({
        LIQUID: snapshot.items?.LIQUID || [],
        INVESTMENTS: snapshot.items?.INVESTMENTS || [],
        RECEIVABLES: snapshot.items?.RECEIVABLES || [],
        LIABILITIES: snapshot.items?.LIABILITIES || []
      });
    }
  }, [snapshot]);

  if (!isOpen || !snapshot) return null;

  const calculateCategoryTotal = (group: string) => {
    return items[group]?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
  };

  const liquidTotal = calculateCategoryTotal("LIQUID");
  const investmentsTotal = calculateCategoryTotal("INVESTMENTS");
  const receivablesTotal = calculateCategoryTotal("RECEIVABLES");
  const liabilitiesTotal = calculateCategoryTotal("LIABILITIES");

  const totalNetWorth = (liquidTotal + investmentsTotal + receivablesTotal) - liabilitiesTotal;

  const handleUpdateItem = (group: string, index: number, field: keyof PortfolioSnapshotItem, value: string | number) => {
    setItems(prev => {
      const newGroupItems = [...prev[group]];
      newGroupItems[index] = { 
        ...newGroupItems[index], 
        [field]: field === 'amount' ? Number(value) : value 
      };
      return { ...prev, [group]: newGroupItems };
    });
  };

  const handleAddItem = (group: string) => {
    setItems(prev => ({
      ...prev,
      [group]: [...(prev[group] || []), { name: "New Item", amount: 0 }]
    }));
    setExpandedCategory(group);
  };

  const handleRemoveItem = (group: string, index: number) => {
    setItems(prev => ({
      ...prev,
      [group]: prev[group].filter((_, i) => i !== index)
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await savePortfolioSnapshot({
        user_id: snapshot.user_id,
        monthYear: snapshot.monthYear,
        totalNetWorth,
        liquid: liquidTotal,
        investments: investmentsTotal,
        receivables: receivablesTotal,
        liabilities: liabilitiesTotal,
        items
      }, encryptionKey);
      toast.success(`Snapshot for ${snapshot.monthYear} updated`);
      onClose();
    } catch (err) {
      toast.error("Failed to update snapshot");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const CATEGORIES = [
    { id: 'LIQUID', label: 'Liquid Assets', color: 'text-secondary' },
    { id: 'INVESTMENTS', label: 'Investments', color: 'text-primary' },
    { id: 'RECEIVABLES', label: 'Receivables', color: 'text-purple-400' },
    { id: 'LIABILITIES', label: 'Liabilities', color: 'text-tertiary' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#060912]/85 backdrop-blur-xl transition-opacity duration-500"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl glass-card rounded-[2.5rem] border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-700 bg-[#060912]/90 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/[0.02] shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-1 w-6 bg-blue-500 rounded-full" />
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Identity Management</span>
            </div>
            <h3 className="text-3xl font-black font-display text-white tracking-tighter italic">
              Edit Breakdown: <span className="text-blue-500 not-italic uppercase font-sans tracking-wide">{snapshot.monthYear}</span>
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-2xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all group"
          >
            <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar space-y-8 flex-1">
          
          {/* Net Worth Summary */}
          <div className="glass-card p-6 bg-blue-500/5 border-blue-500/20 flex flex-col items-center text-center relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
             <span className="text-[10px] font-black text-blue-400/60 uppercase tracking-widest mb-1 relative z-10">Calculated Net Worth</span>
             <span className="text-4xl font-black font-display text-white tracking-tighter tabular-nums drop-shadow-glow-blue relative z-10">
                {formatINR(totalNetWorth)}
             </span>
          </div>

          <div className="space-y-4">
            {CATEGORIES.map((cat) => {
              const categoryTotal = calculateCategoryTotal(cat.id);
              const isExpanded = expandedCategory === cat.id;
              const catItems = items[cat.id] || [];

              return (
                <div key={cat.id} className={`glass-card overflow-hidden transition-all duration-500 ${isExpanded ? 'border-white/20 bg-white/[0.02]' : 'border-white/5 bg-white/[0.01]'}`}>
                  <button 
                    type="button"
                    onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                    className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-2 w-2 rounded-full ${cat.id === 'LIABILITIES' ? 'bg-rose-500' : 'bg-primary'} shadow-glow-primary`} />
                      <div className="text-left">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block">{cat.label}</span>
                        <span className="text-lg font-black font-display text-white tracking-tight">{formatINR(categoryTotal)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-white/10 uppercase tracking-widest">{catItems.length} IDs</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-white/20" /> : <ChevronDown className="h-4 w-4 text-white/20" />}
                    </div>
                  </button>

                  <div className={`transition-all duration-500 ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                    <div className="p-5 pt-0 space-y-3">
                      <div className="h-px w-full bg-white/5 mb-4" />
                      
                      {catItems.map((item, idx) => (
                        <div key={idx} className="flex gap-3 items-center group animate-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                          <input 
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItem(cat.id, idx, 'name', e.target.value)}
                            className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all"
                            placeholder="Item Name"
                          />
                          <div className="relative w-32">
                            <input 
                              type="number"
                              value={item.amount || ""}
                              onChange={(e) => handleUpdateItem(cat.id, idx, 'amount', e.target.value)}
                              className="w-full bg-white/[0.03] border border-white/5 rounded-xl pl-8 pr-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none"
                              placeholder="0"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-white/20 font-bold">₹</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleRemoveItem(cat.id, idx)}
                            className="p-2.5 rounded-xl bg-rose-500/5 text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/20 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}

                      <button 
                        type="button"
                        onClick={() => handleAddItem(cat.id)}
                        className="w-full py-3 mt-4 border border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-widest hover:border-blue-500/30 hover:text-blue-400 hover:bg-blue-500/5 transition-all group"
                      >
                        <Plus className="h-3 w-3 group-hover:rotate-90 transition-transform duration-300" />
                        Append Identity
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-white/[0.02] shrink-0">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-4 bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-white/10 transition-all"
            >
              Discard Changes
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-8 py-4 bg-white text-background text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:shadow-glow-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? "Persisting..." : <><Save className="h-4 w-4" /> Save Snapshot</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
