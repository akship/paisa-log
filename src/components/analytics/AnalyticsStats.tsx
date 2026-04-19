"use client";

import { TrendingUp, ArrowRight } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { PRISM_COLORS } from "@/lib/constants";

interface SavingsPoolCardProps {
  savingsTotal: number;
  incomeTotal: number;
  expenseTotal: number;
}

export function SavingsPoolCard({ savingsTotal, incomeTotal, expenseTotal }: SavingsPoolCardProps) {
  return (
    <div className="glass-card p-6 rounded-3xl border-white/5 bg-white/[0.01] overflow-hidden relative group">
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`h-1.5 w-1.5 rounded-full ${savingsTotal >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Net Savings</span>
        </div>
        <TrendingUp className={`h-4 w-4 ${savingsTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'} opacity-20 group-hover:opacity-60 transition-all`} />
      </div>
      <h3 className="text-2xl font-black font-display text-white tracking-tighter">Savings Pool</h3>
      <div className="flex items-baseline gap-2 mt-1">
        <p className={`text-xl font-black ${savingsTotal >= 0 ? 'text-emerald-400/60' : 'text-rose-400/60'}`}>
          {formatINR(savingsTotal)}
        </p>
        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">
          {expenseTotal > 0 ? ((savingsTotal / incomeTotal) * 100).toFixed(0) : '0'}%
        </span>
      </div>
    </div>
  );
}

interface TotalSpendsCardProps {
  activeCategoryId: string;
  expenseTotal: number;
  expensesByCategory: Record<string, number>;
  onSelect: () => void;
}

export function TotalSpendsCard({ activeCategoryId, expenseTotal, expensesByCategory, onSelect }: TotalSpendsCardProps) {
  const isSelected = activeCategoryId === 'total';
  
  return (
    <div 
      onClick={onSelect}
      className={`glass-card rounded-3xl border-white/5 cursor-pointer group transition-all duration-500 overflow-hidden ${isSelected ? 'bg-white/[0.08] border-white/20 shadow-2xl translate-y--1' : 'bg-white/[0.01] hover:bg-white/[0.03]'}`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-blue-400 shadow-[0_0_10px_#3b82f6]' : 'bg-white/20'}`} />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Aggregate View</span>
          </div>
          <ArrowRight className={`h-4 w-4 transition-all duration-500 ${isSelected ? 'text-blue-400 translate-x-1' : 'text-white/10'}`} />
        </div>
        <h3 className="text-2xl font-black font-display text-white tracking-tighter">Total Spends</h3>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-xl font-black text-white/40">{formatINR(expenseTotal)}</p>
        </div>
      </div>

      {isSelected && (
        <div className="xl:hidden px-8 pb-8 animate-in slide-in-from-top-4 duration-500">
          <div className="h-px bg-white/5 mb-8" />
          <div className="h-[280px] w-full relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Total</p>
                <p className="text-xl font-black font-display text-white">{formatINR(expenseTotal)}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(expensesByCategory).map(([name, value], idx) => ({ name, value, color: PRISM_COLORS[idx % PRISM_COLORS.length] }))}
                  cx="50%"
                  cy="50%"
                  innerRadius="65%"
                  outerRadius="85%"
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  animationDuration={1000}
                >
                  {Object.entries(expensesByCategory).map(([cat, val], index) => (
                    <Cell 
                      key={`cell-total-mini-${index}`} 
                      fill={PRISM_COLORS[index % PRISM_COLORS.length]}
                      style={{ filter: `drop-shadow(0 0 10px ${PRISM_COLORS[index % PRISM_COLORS.length]}20)` }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

interface ValuationCardProps {
  label: string;
  value: number;
  subtitle: string;
  isMain?: boolean;
}

export function ValuationCard({ label, value, subtitle, isMain }: ValuationCardProps) {
  return (
    <div className="glass-card p-10 rounded-[2.5rem] border-white/5">
      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">{label}</p>
      <p className={`text-4xl font-black font-display tracking-tighter ${isMain ? 'text-white' : 'text-white/40'}`}>
        {formatINR(value)}
      </p>
      <p className={`text-xs font-bold mt-2 ${isMain ? 'text-white/40 text-shadow-glow-primary' : 'text-white/20'}`}>{subtitle}</p>
    </div>
  );
}
