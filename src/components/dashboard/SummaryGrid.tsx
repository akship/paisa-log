"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { useData } from "@/lib/DataContext";

export default function SummaryGrid() {
  const { currentMonthStats: stats } = useData();

  const { income, expense } = stats;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Income Analysis Card */}
        <Link href="/analytics?tab=spending" className="group/card">
          <div className="glass-card glass-interactive p-8 h-[220px] flex flex-col relative overflow-hidden border-secondary/10">
            <div className="absolute right-8 top-8 p-3.5 bg-secondary/10 rounded-2xl border border-secondary/20 group-hover/card:scale-110 transition-transform duration-500">
              <ArrowDownRight className="h-5 w-5 text-secondary" />
            </div>
            <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] mb-4 opacity-80">Total Inflow</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface mb-2 font-display">
              <span className="opacity-20 mr-1 font-normal text-xl translate-y-[-2px] inline-block">₹</span>{formatINR(income).replace('₹', '')}
            </h2>
            <div className="mt-auto pt-6">
              <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-secondary shadow-glow-secondary transition-all duration-1000" 
                  style={{ width: `${income > 0 ? (income / (income + expense || 1)) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </Link>
 
        {/* Expense Analysis Card */}
        <Link href="/analytics?tab=spending" className="group/card">
          <div className="glass-card glass-interactive p-8 h-[220px] flex flex-col relative overflow-hidden border-tertiary/10">
            <div className="absolute right-8 top-8 p-3.5 bg-tertiary/10 rounded-2xl border border-tertiary/20 group-hover/card:scale-110 transition-transform duration-500">
              <ArrowUpRight className="h-5 w-5 text-tertiary" />
            </div>
            <p className="text-[10px] font-black text-tertiary uppercase tracking-[0.3em] mb-4 opacity-80">Monthly Expense</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface mb-2 font-display">
              <span className="opacity-20 mr-1 font-normal text-xl translate-y-[-2px] inline-block">₹</span>{formatINR(expense).replace('₹', '')}
            </h2>
            <div className="mt-auto pt-6">
              <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-tertiary shadow-glow-tertiary transition-all duration-1000" 
                  style={{ width: `${expense > 0 ? (expense / (income + expense || 1)) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
