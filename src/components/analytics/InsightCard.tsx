"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatINR } from "@/lib/utils";
import { Transaction } from "@/lib/firebase/firestore";
import { ChevronDown, ChevronRight, Pencil } from "lucide-react";
import { format } from "date-fns";

interface ChartEntry {
  name: string;
  value: number;
  color: string;
  type: string;
}

interface InsightCardProps {
  name: string;
  total: number;
  transactions: Transaction[];
  color: string;
  isOpen: boolean;
  isActive: boolean;
  onToggle: () => void;
  onEditTransaction: (tx: Transaction) => void;
  chartData?: ChartEntry[];
}

export default function InsightCard({ 
  name, 
  total, 
  transactions, 
  color, 
  isOpen, 
  isActive, 
  onToggle, 
  onEditTransaction,
  chartData = []
}: InsightCardProps) {
  return (
    <div className={`glass-card rounded-[2rem] border-white/5 overflow-hidden transition-all duration-500 ${isOpen ? 'bg-white/[0.04] shadow-2xl scale-[1.01]' : 'bg-white/[0.01] hover:bg-white/[0.03]'} ${isActive ? 'ring-2 ring-blue-500/20 ring-offset-4 ring-offset-[#060912]' : ''}`}>
      <div className="p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer group" onClick={onToggle}>
         <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className={`h-1.5 w-1.5 shrink-0 rounded-full group-hover:scale-150 transition-transform duration-500`} style={{ backgroundColor: color, boxShadow: `0 0 15px ${color}` }} />
            <div className="min-w-0">
               <h4 className="text-sm md:text-base font-black font-display text-white tracking-tight truncate">{name}</h4>
               <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-0.5">{transactions.length} Cycles</p>
            </div>
         </div>
         <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
               <p className="text-lg md:text-xl font-black font-display text-white tracking-tighter">{formatINR(total)}</p>
               <p className="text-[9px] font-bold text-white/20 group-hover:text-white/40 transition-colors uppercase tracking-widest">{isOpen ? 'Close' : 'Focus'}</p>
            </div>
            <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors">
               {isOpen ? <ChevronDown className="h-4 w-4 text-white/40" /> : <ChevronRight className="h-4 w-4 text-white/20" />}
            </div>
         </div>
      </div>

      {isOpen && (
        <div className="px-5 pb-7 md:px-7 animate-in slide-in-from-top-4 duration-500">
           <div className="h-px bg-white/5 mb-5" />
           
           {/* Mobile View Pie Chart */}
           {chartData && chartData.length > 0 && (
             <div className="xl:hidden h-[280px] w-full mb-8 relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Focused</p>
                    <p className="text-xl font-black font-display text-white">{formatINR(total)}</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius="65%"
                      outerRadius="85%"
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      animationDuration={1000}
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-mini-${index}`} 
                          fill={entry.color}
                          style={{ filter: `drop-shadow(0 0 10px ${entry.color}20)` }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
             </div>
           )}

           <div className="space-y-2">
              {[...transactions].sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).map((tx, i) => (
                <div key={tx.id || i} className="group/row flex items-center justify-between p-3 rounded-2xl border border-transparent hover:border-white/5 hover:bg-white/[0.02] transition-all gap-4">
                   <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-white/90">{format(tx.timestamp, "MMM dd, yyyy")}</p>
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.05em] mt-0.5 truncate">{tx.description || 'General'}</p>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-3 shrink-0">
                      <p className="text-sm font-black text-white/60 tabular-nums">{formatINR(tx.amount)}</p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTransaction(tx);
                        }}
                        className="p-2 rounded-lg bg-white/5 text-white/20 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover/row:opacity-100 scale-90 active:scale-75"
                        title="Refine Transaction"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}
