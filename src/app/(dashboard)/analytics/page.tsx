"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth";
import { Transaction } from "@/lib/firebase/firestore";
import { useData } from "@/lib/DataContext";
import { formatINR } from "@/lib/utils";
import dynamic from "next/dynamic";
import { 
  startOfMonth, 
  endOfMonth, 
  subDays, 
  isWithinInterval,
  parseISO,
  format
} from "date-fns";
import { Calendar, TrendingUp, ArrowUpRight, ArrowDownRight, Wallet, Activity, ArrowRight } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import SectionHeader from "@/components/layout/SectionHeader";
import InsightCard from "@/components/analytics/InsightCard";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";

const SpendingChart = dynamic(() => import("@/components/analytics/SpendingChart"), {
  loading: () => (
    <div className="lg:col-span-8 glass-card rounded-[3rem] border-white/5 p-8 md:p-12 flex items-center justify-center min-h-[500px] md:min-h-[600px]">
      <div className="h-10 w-10 border-2 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
    </div>
  ),
  ssr: false,
});

const GrowthChart = dynamic(() => import("@/components/analytics/GrowthChart"), {
  loading: () => (
    <div className="w-full glass-card rounded-[3rem] border-white/5 p-8 md:p-12 flex items-center justify-center min-h-[500px]">
      <div className="h-10 w-10 border-2 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
    </div>
  ),
  ssr: false,
});

const SnapshotManager = dynamic(() => import("@/components/analytics/SnapshotManager"), {
  loading: () => (
    <div className="w-full glass-card rounded-[3rem] border-white/5 p-8 md:p-12 animate-pulse mt-12">
      <div className="h-8 w-48 bg-white/5 rounded-full mb-8" />
      <div className="space-y-4">
        <div className="h-20 bg-white/5 rounded-2xl" />
        <div className="h-20 bg-white/5 rounded-2xl" />
      </div>
    </div>
  ),
  ssr: false,
});

type Preset = "current_month" | "current_fy" | "custom";

const PRISM_COLORS = [
  "#0ea5e9", // Sky 500
  "#06b6d4", // Cyan 500
  "#3b82f6", // Blue 500
  "#6366f1", // Indigo 500
  "#2dd4bf", // Teal 500
  "#38bdf8", // Sky 400
  "#22d3ee", // Cyan 400
  "#60a5fa", // Blue 400
];

export default function AnalyticsPage() {
  const { user, encryptionKey } = useAuth();
  const { 
    transactions: rawTransactions, 
    transactionsLoading: loading, 
    portfolioHistory, 
    portfolioLoading 
  } = useData();
  
  const [activeTab, setActiveTab] = useState<"spending" | "growth">("spending");
  const [preset, setPreset] = useState<Preset>("current_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("total");

  const getFYDates = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth(); 
    
    let fyStart: Date;
    let fyEnd: Date;

    if (month >= 3) { 
      fyStart = new Date(year, 3, 1);
      fyEnd = new Date(year + 1, 2, 31, 23, 59, 59, 999);
    } else {
      fyStart = new Date(year - 1, 3, 1);
      fyEnd = new Date(year, 2, 31, 23, 59, 59, 999);
    }
    return { start: fyStart, end: fyEnd };
  };

  useEffect(() => {
    const today = new Date();
    setCustomStart(format(subDays(today, 30), "yyyy-MM-dd"));
    setCustomEnd(format(today, "yyyy-MM-dd"));
  }, []);

  const filteredTransactions = useMemo(() => {
    const today = new Date();
    let start: Date;
    let end: Date;

    if (preset === "current_month") {
      start = startOfMonth(today);
      end = endOfMonth(today);
    } else if (preset === "current_fy") {
      const fy = getFYDates(today);
      start = fy.start;
      end = fy.end;
    } else {
      start = customStart ? parseISO(customStart) : subDays(today, 30);
      end = customEnd ? parseISO(customEnd) : today;
      end.setHours(23, 59, 59, 999);
    }

    return rawTransactions.filter(tx => isWithinInterval(tx.timestamp, { start, end }));
  }, [rawTransactions, preset, customStart, customEnd]);

  const { incomeTotal, expenseTotal, expensesByCategory, incomeByCategory, transactionsByCategory } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    const expCatSum: Record<string, number> = {};
    const incCatSum: Record<string, number> = {};
    const txByCat: Record<string, Transaction[]> = {};
    
    for(const tx of filteredTransactions) {
      if (!txByCat[tx.category]) txByCat[tx.category] = [];
      txByCat[tx.category].push(tx);

      if(tx.type === "income") {
        inc += tx.amount;
        incCatSum[tx.category] = (incCatSum[tx.category] || 0) + tx.amount;
      } else {
        exp += tx.amount;
        expCatSum[tx.category] = (expCatSum[tx.category] || 0) + tx.amount;
      }
    }
    return { incomeTotal: inc, expenseTotal: exp, expensesByCategory: expCatSum, incomeByCategory: incCatSum, transactionsByCategory: txByCat };
  }, [filteredTransactions]);

  const hasSavings = incomeTotal >= expenseTotal;
  
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

    return { chartData: data, chartTitle: `${catName} Allocation` };
  }, [activeCategoryId, expensesByCategory, transactionsByCategory]);

  const toggleCategory = (id: string) => {
    setActiveCategoryId(prev => prev === id ? "total" : id);
  };

  return (
    <div className="flex flex-col space-y-10 max-w-7xl mx-auto selection:bg-blue-500/30">
      
      <PageHeader 
        category="Analytics"
        title="Wealth Insights"
        subtitle={<>Capital allocation <span className="text-white/60">and balance insights.</span></>}
        actions={
          <div className="flex flex-col items-end gap-3 mt-4 md:mt-0">
            <div className="flex p-1 bg-white/[0.03] border border-white/5 rounded-xl backdrop-blur-md">
              {(["spending", "growth"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab === "growth") setActiveCategoryId("total");
                  }}
                  className={`px-6 py-2 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] rounded-lg transition-all duration-500 whitespace-nowrap ${
                    activeTab === tab ? "bg-white text-[#060912] shadow-[0_0_20px_rgba(255,255,255,0.1)]" : "text-white/30 hover:text-white/60"
                  }`}
                >
                  {tab === "spending" ? "Spend" : "Growth"}
                </button>
              ))}
            </div>

            {activeTab === "spending" && (
              <div className="flex flex-col items-end gap-3">
                <div className="flex p-1 bg-white/[0.03] border border-white/5 rounded-xl backdrop-blur-md">
                  {(["current_month", "current_fy", "custom"] as Preset[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPreset(p)}
                      className={`px-4 py-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-500 ${
                        preset === p ? "bg-white text-[#060912]" : "text-white/30 hover:text-white/60"
                      }`}
                    >
                      {p === "current_fy" ? "FY" : p.replace("_", " ")}
                    </button>
                  ))}
                </div>
                
                {preset === "custom" && (
                  <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl animate-in fade-in duration-300">
                    <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="bg-transparent text-[10px] md:text-xs font-bold text-white focus:outline-none [color-scheme:dark]" />
                    <span className="text-white/10 text-[10px] font-black">—</span>
                    <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="bg-transparent text-[10px] md:text-xs font-bold text-white focus:outline-none [color-scheme:dark]" />
                  </div>
                )}
              </div>
            )}
          </div>
        }
      />

      {(activeTab === "spending" ? loading : portfolioLoading) ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 border-2 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.4em] animate-pulse opacity-60">
            {activeTab === "spending" ? "Loading transactions..." : "Loading portfolio history..."}
          </p>
        </div>
      ) : activeTab === "spending" ? (
        <>
          {filteredTransactions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-20 glass-card rounded-[3rem] border-white/5">
              <Activity className="h-16 w-16 text-white/5 mb-8" />
              <h3 className="text-3xl font-black text-white/50 tracking-tight font-display mb-2">No data found</h3>
              <p className="text-white/20 text-lg font-medium max-w-sm">No transactions recorded for this period.</p>
            </div>
          ) : (
            <div className="grid xl:grid-cols-12 gap-10 items-start pb-32">
              {/* Left Column: Spending Chart */}
              <SpendingChart 
                title={chartTitle}
                chartData={chartData} 
                expenseTotal={activeCategoryId === 'total' ? expenseTotal : chartData.reduce((acc, curr) => acc + curr.value, 0)} 
                hasSavings={hasSavings} 
              />

              {/* Right Column: Transaction Groups Sidebar */}
              <div className="xl:col-span-5 flex flex-col gap-6">
                 {/* Total Spends Card (Default Selection) */}
                 <div 
                   onClick={() => setActiveCategoryId("total")}
                   className={`glass-card p-8 rounded-3xl border-white/5 cursor-pointer group transition-all duration-500 ${activeCategoryId === 'total' ? 'bg-white/[0.08] border-white/20 shadow-2xl translate-y--1' : 'bg-white/[0.01] hover:bg-white/[0.03]'}`}
                 >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                         <div className={`h-1.5 w-1.5 rounded-full ${activeCategoryId === 'total' ? 'bg-blue-400' : 'bg-white/20'}`} />
                         <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Aggregate View</span>
                      </div>
                      <ArrowRight className={`h-4 w-4 transition-all duration-500 ${activeCategoryId === 'total' ? 'text-blue-400 translate-x-1' : 'text-white/10'}`} />
                    </div>
                    <h3 className="text-3xl font-black font-display text-white tracking-tighter">Total Spends</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                       <p className="text-xl font-black text-white/40">{formatINR(expenseTotal)}</p>
                    </div>
                    {activeCategoryId === 'total' && (
                        <p className="text-[10px] font-bold text-blue-400/60 uppercase tracking-widest mt-4">Currently Focused</p>
                    )}
                 </div>

                 <div className="h-px bg-white/5 my-2" />

                 {/* Income Categories */}
                 <div className="space-y-4">
                    <div className="px-2 flex items-center justify-between">
                       <h4 className="text-[10px] font-black text-blue-500/60 uppercase tracking-[0.3em]">Inflow Sources</h4>
                       <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{formatINR(incomeTotal)}</span>
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

                 {/* Expense Categories */}
                 <div className="space-y-4 mt-4">
                    <div className="px-2 flex items-center justify-between">
                       <h4 className="text-[10px] font-black text-cyan-500/60 uppercase tracking-[0.3em]">Expense Sectors</h4>
                       <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{formatINR(expenseTotal)}</span>
                    </div>
                    {Object.entries(expensesByCategory).sort((a,b) => b[1] - a[1]).map(([cat, val]) => (
                      <InsightCard 
                        key={cat} 
                        name={cat} 
                        total={val} 
                        transactions={transactionsByCategory[cat] || []} 
                        color="#06b6d4" 
                        isOpen={activeCategoryId === `expense:${cat}`}
                        isActive={activeCategoryId === `expense:${cat}`}
                        onToggle={() => toggleCategory(`expense:${cat}`)}
                        onEditTransaction={setEditingTx} 
                      />
                    ))}
                 </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex flex-col space-y-12 pb-32">
          {portfolioHistory.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-20 glass-card rounded-[3rem] border-white/5">
              <TrendingUp className="h-16 w-16 text-white/5 mb-8" />
              <h3 className="text-3xl font-black text-white/50 tracking-tight font-display mb-2">Build Your History</h3>
              <p className="text-white/20 text-lg font-medium max-w-sm">Save monthly snapshots in the Portfolio tab to track your growth over time.</p>
            </div>
          ) : (
            <>
              {(() => {
                const validHistory = portfolioHistory.filter(s => s.totalNetWorth !== -1);
                if (validHistory.length === 0) return (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-20 glass-card rounded-[3rem] border-white/5">
                    <TrendingUp className="h-16 w-16 text-white/5 mb-8" />
                    <h3 className="text-3xl font-black text-white/50 tracking-tight font-display mb-2">Build Your History</h3>
                    <p className="text-white/20 text-lg font-medium max-w-sm">Save monthly snapshots in the Portfolio tab to track your growth over time.</p>
                  </div>
                );

                return (
                  <>
                    <div className="glass-card rounded-[3rem] border-white/5 p-8 md:p-12 relative flex flex-col animate-in fade-in duration-1000">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Wealth Trajectory</h2>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Total Net Worth</span>
                        </div>
                      </div>
                      <GrowthChart data={validHistory} />
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="glass-card p-10 rounded-[2.5rem] border-white/5">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Latest Valuation</p>
                        <p className="text-4xl font-black font-display text-white tracking-tighter">
                          {formatINR(validHistory[validHistory.length - 1]?.totalNetWorth || 0)}
                        </p>
                        <p className="text-xs font-bold text-white/40 mt-2">As of {validHistory[validHistory.length - 1]?.monthYear}</p>
                      </div>

                      <div className="glass-card p-10 rounded-[2.5rem] border-white/5">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Launch Valuation</p>
                        <p className="text-4xl font-black font-display text-white/40 tracking-tighter">
                          {formatINR(validHistory[0]?.totalNetWorth || 0)}
                        </p>
                        <p className="text-xs font-bold text-white/20 mt-2">First record: {validHistory[0]?.monthYear}</p>
                      </div>

                      <div className="glass-card p-10 rounded-[2.5rem] border-white/5 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Overall Growth</p>
                          <div className="flex items-baseline gap-2">
                            <p className={`text-4xl font-black font-display tracking-tighter ${
                              (validHistory[validHistory.length - 1]?.totalNetWorth || 0) >= (validHistory[0]?.totalNetWorth || 0)
                              ? "text-blue-400" : "text-rose-500"
                            }`}>
                              {formatINR((validHistory[validHistory.length - 1]?.totalNetWorth || 0) - (validHistory[0]?.totalNetWorth || 0))}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          <TrendingUp className="h-4 w-4 text-blue-400/50" />
                          <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Trajectory analysis</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8">
                       <SnapshotManager history={portfolioHistory} encryptionKey={encryptionKey} />
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}
      <AddTransactionModal 
        isOpen={!!editingTx} 
        onClose={() => setEditingTx(null)} 
        initialData={editingTx}
      />
    </div>
  );
}
