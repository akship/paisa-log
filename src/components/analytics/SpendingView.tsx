"use client";

import { useMemo } from "react";
import { Activity } from "lucide-react";
import { Transaction } from "@/lib/firebase/firestore";
import { PRISM_COLORS } from "@/lib/constants";
import SpendingChart from "@/components/analytics/SpendingChart";
import InsightCard from "@/components/analytics/InsightCard";
import { SavingsPoolCard, TotalSpendsCard } from "./AnalyticsStats";

interface SpendingViewProps {
  filteredTransactions: Transaction[];
  incomeTotal: number;
  expenseTotal: number;
  expensesByCategory: Record<string, number>;
  incomeByCategory: Record<string, number>;
  transactionsByCategory: Record<string, Transaction[]>;
  activeCategoryId: string;
  setActiveCategoryId: (id: string) => void;
  setEditingTx: (tx: Transaction | null) => void;
}

export default function SpendingView({
  filteredTransactions,
  incomeTotal,
  expenseTotal,
  expensesByCategory,
  incomeByCategory,
  transactionsByCategory,
  activeCategoryId,
  setActiveCategoryId,
  setEditingTx
}: SpendingViewProps) {
  
  const savingsTotal = incomeTotal - expenseTotal;
  const hasSavings = savingsTotal > 0;

  const { chartData, chartTitle } = useMemo(() => {
    if (activeCategoryId === "total") {
      const data = Object.entries(expensesByCategory)
        .sort((a,b) => b[1] - a[1])
        .map(([name, value], idx) => ({
          name,
          value,
          color: PRISM_COLORS[idx % PRISM_COLORS.length],
          type: "expense"
        }));
      return { chartData: data, chartTitle: "Spending Breakdown" };
    }

    const [type, catName] = activeCategoryId.split(':');
    const transactions = transactionsByCategory[catName] || [];
    
    // Aggregating by memo as requested
    const memoSum: Record<string, number> = {};
    for (const tx of transactions) {
      const memo = tx.description || 'General';
      memoSum[memo] = (memoSum[memo] || 0) + tx.amount;
    }

    const data = Object.entries(memoSum)
      .sort((a,b) => b[1] - a[1])
      .map(([name, value], idx) => ({
        name,
        value,
        color: PRISM_COLORS[idx % PRISM_COLORS.length],
        type
      }));

    return { chartData: data, chartTitle: `${catName} Breakdown` };
  }, [activeCategoryId, expensesByCategory, transactionsByCategory]);

  const toggleCategory = (id: string) => {
    setActiveCategoryId(activeCategoryId === id ? "total" : id);
  };

  if (filteredTransactions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-20 glass-card rounded-[3rem] border-white/5">
        <Activity className="h-16 w-16 text-white/5 mb-8" />
        <h3 className="text-3xl font-black text-white/50 tracking-tight font-display mb-2">No data found</h3>
        <p className="text-white/20 text-lg font-medium max-w-sm">No transactions recorded for this period.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-32">
      {/* Top Row: Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SavingsPoolCard 
          savingsTotal={savingsTotal}
          incomeTotal={incomeTotal}
          expenseTotal={expenseTotal}
        />

        <TotalSpendsCard 
          activeCategoryId={activeCategoryId}
          expenseTotal={expenseTotal}
          expensesByCategory={expensesByCategory}
          onSelect={() => setActiveCategoryId("total")}
        />
      </div>

      {/* Main Content: Chart & Sidebar */}
      <div className="grid xl:grid-cols-12 gap-10 items-start">
        {/* Left Column: Spending Chart */}
        <SpendingChart 
          title={chartTitle}
          chartData={chartData} 
          expenseTotal={activeCategoryId === 'total' ? expenseTotal : chartData.reduce((acc, curr) => acc + curr.value, 0)} 
          hasSavings={hasSavings} 
        />

        {/* Right Column: Transaction Groups Sidebar */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          {/* Expense Categories */}
          <div className="space-y-4">
            <div className="px-2 flex items-center justify-between">
              <h4 className="text-[10px] font-black text-cyan-500/60 uppercase tracking-[0.3em]">Expense Sectors</h4>
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest text-shadow-glow-primary">Unified Breakdown</span>
            </div>
            {Object.entries(expensesByCategory).sort((a,b) => b[1] - a[1]).map(([cat, val], idx) => {
              const memoSum: Record<string, number> = {};
              const transactions = transactionsByCategory[cat] || [];
              for (const tx of transactions) {
                const memo = tx.description || 'General';
                memoSum[memo] = (memoSum[memo] || 0) + tx.amount;
              }
              const catChartData = Object.entries(memoSum)
                .sort((a,b) => b[1] - a[1])
                .map(([name, value], mIdx) => ({
                  name,
                  value,
                  color: PRISM_COLORS[(idx + mIdx) % PRISM_COLORS.length],
                  type: "expense"
                }));

              return (
                <InsightCard 
                  key={cat} 
                  name={cat} 
                  total={val} 
                  transactions={transactions} 
                  color={PRISM_COLORS[idx % PRISM_COLORS.length]} 
                  isOpen={activeCategoryId === `expense:${cat}`}
                  isActive={activeCategoryId === `expense:${cat}`}
                  onToggle={() => toggleCategory(`expense:${cat}`)}
                  onEditTransaction={setEditingTx}
                  chartData={catChartData}
                />
              );
            })}
          </div>

          {/* Income Categories */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="px-2 flex items-center justify-between">
              <h4 className="text-[10px] font-black text-blue-500/60 uppercase tracking-[0.3em]">Total Inflow</h4>
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest text-shadow-glow-secondary">Consolidated View</span>
            </div>
            {Object.entries(incomeByCategory).sort((a,b) => b[1] - a[1]).map(([cat, val]) => (
              <InsightCard 
                key={cat} 
                name={cat} 
                total={val} 
                transactions={transactionsByCategory[cat] || []} 
                color="#3b82f6" 
                isOpen={activeCategoryId === `income:${cat}`}
                isActive={activeCategoryId === `income:${cat}`}
                onToggle={() => toggleCategory(`income:${cat}`)}
                onEditTransaction={setEditingTx} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
