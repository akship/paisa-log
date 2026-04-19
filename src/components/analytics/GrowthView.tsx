"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { PortfolioSnapshot } from "@/lib/firebase/firestore";
import { usePortfolio } from "@/lib/PortfolioContext";
import { formatINR } from "@/lib/utils";
import GrowthChart from "@/components/analytics/GrowthChart";
import SnapshotManager from "@/components/analytics/SnapshotManager";
import { ValuationCard } from "./AnalyticsStats";

interface GrowthViewProps {
  portfolioHistory: PortfolioSnapshot[];
  netWorth: number;
  liquid: number;
  investments: number;
  receivables: number;
  liabilities: number;
  userId: string;
  encryptionKey: CryptoKey | null;
}

export default function GrowthView({
  portfolioHistory,
  netWorth,
  liquid,
  investments,
  receivables,
  liabilities,
  userId,
  encryptionKey
}: GrowthViewProps) {
  
  const { growthData, validHistory, overallGrowth } = usePortfolio();

  if (growthData.length === 0 && netWorth <= 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-20 glass-card rounded-[3rem] border-white/5">
        <TrendingUp className="h-16 w-16 text-white/5 mb-8" />
        <h3 className="text-3xl font-black text-white/50 tracking-tight font-display mb-2">Build Your History</h3>
        <p className="text-white/20 text-lg font-medium max-w-sm">Save monthly snapshots in the Portfolio tab to track your growth over time.</p>
      </div>
    );
  }


  return (
    <div className="flex-1 flex flex-col space-y-12 pb-32 animate-in fade-in duration-1000">
      <div className="glass-card rounded-[3rem] border-white/5 p-8 md:p-12 relative flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Wealth Trajectory</h2>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Growth Forecast</span>
          </div>
        </div>
        <GrowthChart data={growthData} />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <ValuationCard 
          label="Latest Valuation"
          value={netWorth}
          subtitle="Unified Real-time Calculation"
          isMain
        />

        <ValuationCard 
          label="Launch Valuation"
          value={validHistory[0]?.totalNetWorth || 0}
          subtitle={`First record: ${validHistory[0]?.monthYear || 'N/A'}`}
        />

        <div className="glass-card p-10 rounded-[2.5rem] border-white/5 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Overall Growth</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-4xl font-black font-display tracking-tighter ${
                overallGrowth >= 0 ? "text-blue-400" : "text-rose-500"
              }`}>
                {formatINR(overallGrowth)}
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
    </div>
  );
}
