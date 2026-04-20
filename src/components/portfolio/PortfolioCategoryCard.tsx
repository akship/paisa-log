"use client";

import { motion } from "framer-motion";
import { PortfolioItem, PortfolioCategoryGroup, deletePortfolioItem } from "@/lib/firebase/firestore";
import { formatINR } from "@/lib/utils";
import { Landmark, TrendingUp, HandCoins, CreditCard, Trash2, Edit2 } from "lucide-react";

interface Props {
  group: PortfolioCategoryGroup;
  items: PortfolioItem[];
  totalAssets?: number;
  onEdit: (item: PortfolioItem) => void;
  onAdd: (group: PortfolioCategoryGroup) => void;
}

const GROUP_CONFIG = {
  LIQUID: { label: "Liquid Assets", icon: Landmark, color: "text-secondary", bg: "bg-secondary/10" },
  INVESTMENTS: { label: "Investments", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10 shadow-glow-primary" },
  RECEIVABLES: { label: "Receivables", icon: HandCoins, color: "text-purple-400", bg: "bg-purple-400/10" },
  LIABILITIES: { label: "Liabilities", icon: CreditCard, color: "text-tertiary", bg: "bg-tertiary/10" },
};

export default function PortfolioCategoryCard({ group, items, totalAssets, onEdit, onAdd }: Props) {
  const config = GROUP_CONFIG[group];
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const weight = totalAssets && totalAssets > 0 ? (total / totalAssets) * 100 : 0;

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this ledger entry?")) {
      await deletePortfolioItem(id);
    }
  };

  return (
    <div className="flex flex-col rounded-[2.5rem] overflow-hidden glass-card glass-interactive transition-all duration-700 bg-white/[0.01]">
      <div className="flex items-center justify-between p-4 md:p-8 border-b border-white/[0.03] bg-white/[0.01]">
        <div className="flex items-center gap-5 md:gap-7">
          <div className={`p-3 md:p-5 rounded-3xl ${config.bg} ${config.color} border border-white/5 transition-all duration-700`}>
            <config.icon className="h-6 w-6 md:h-7 md:w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-[8px] md:text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] opacity-60">{config.label}</h3>
              {group !== 'LIABILITIES' && weight > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[8px] font-black text-primary uppercase tracking-widest whitespace-nowrap">
                  {weight.toFixed(1)}% Weight
                </span>
              )}
            </div>
            <p className={`text-2xl md:text-3xl font-display font-black tracking-tighter ${group === 'LIABILITIES' ? 'text-tertiary' : 'text-on-surface text-shadow-glow'}`}>
              <span className="opacity-30 mr-1 font-normal text-lg translate-y-[-2px] inline-block">₹</span>{formatINR(total).replace('₹', '')}
            </p>
          </div>
        </div>
      </div>

      <div className="p-3 md:p-5 space-y-3 no-scrollbar">
        {items.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center opacity-40">
            <div className={`h-10 w-10 border-2 border-dashed rounded-2xl mb-4 transition-all duration-700 group-hover/card:rotate-45 ${group === 'LIABILITIES' ? 'border-tertiary/30' : 'border-primary/30'}`} />
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-on-surface-variant mt-2">No Records Detected</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item, index) => {
              const isLocked = item.name === "[Locked Portfolio Item]";
              return (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.5, ease: "easeOut" }}
                  key={item.id} 
                  className={`group flex items-center justify-between p-2.5 md:p-4.5 rounded-[1.5rem] glass-interactive border border-transparent hover:border-white/5 ${isLocked ? 'bg-rose-500/5' : 'bg-white/[0.02]'}`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-bold tracking-tight truncate transition-colors ${isLocked ? 'text-rose-500' : 'text-on-surface group-hover:text-white'}`}>
                      {item.name}
                    </span>
                    {isLocked && (
                      <span className="text-[10px] text-rose-500/60 font-medium uppercase tracking-widest mt-0.5">Key Incompatibility</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 md:gap-6 shrink-0">
                    <span className={`text-base md:text-lg font-black font-display tracking-tight ${group === 'LIABILITIES' ? 'text-tertiary' : 'text-on-surface'}`}>
                      <span className="opacity-30 mr-1 font-normal text-sm">{formatINR(item.amount).slice(0, 1)}</span>
                      {formatINR(item.amount).slice(1)}
                    </span>
                    <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all md:translate-x-4 md:group-hover:translate-x-0">
                      <button 
                        onClick={() => !isLocked && onEdit(item)}
                        disabled={isLocked}
                        className={`p-2 rounded-xl bg-white/5 transition-all ${isLocked ? 'opacity-20 cursor-not-allowed' : 'text-on-surface-variant hover:text-white hover:bg-primary/20'}`}
                        title={isLocked ? "Cannot edit locked data" : "Update"}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => item.id && handleDelete(item.id)}
                        className="p-2 rounded-xl bg-white/5 text-on-surface-variant hover:text-white hover:bg-tertiary/20 transition-all"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
