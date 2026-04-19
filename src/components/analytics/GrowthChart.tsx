"use client";

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { formatINR } from "@/lib/utils";
import { PortfolioSnapshot } from "@/lib/firebase/firestore";
import { format } from "date-fns";

interface GrowthChartProps {
  data: PortfolioSnapshot[];
}

export default function GrowthChart({ data }: GrowthChartProps) {
  // Sort data by timestamp and filter out un-decryptable snapshots
  const sortedData = [...data]
    .filter(s => s.totalNetWorth !== -1)
    .sort((a, b) => a.monthYear.localeCompare(b.monthYear));


  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload;
      return (
        <div className="glass-card border-white/10 p-5 rounded-3xl shadow-2xl bg-[#060912]/95 backdrop-blur-2xl animate-in fade-in zoom-in duration-200 min-w-[200px]">
          <p className="text-white/40 font-bold text-[10px] uppercase tracking-widest mb-3">
            {entry.monthYear}
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Net Worth</span>
              <span className="text-blue-400 font-display font-black tracking-tight">{formatINR(entry.totalNetWorth)}</span>
            </div>
            
            <div className="h-px bg-white/5" />
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <p className="text-[8px] text-white/20 font-black uppercase tracking-widest">Liquid</p>
                <p className="text-[11px] text-white/60 font-bold">{formatINR(entry.liquid || 0)}</p>
              </div>
              <div>
                <p className="text-[8px] text-white/20 font-black uppercase tracking-widest">Investments</p>
                <p className="text-[11px] text-white/60 font-bold">{formatINR(entry.investments || 0)}</p>
              </div>
              <div>
                <p className="text-[8px] text-white/20 font-black uppercase tracking-widest">Receivables</p>
                <p className="text-[11px] text-green-400/60 font-bold">+{formatINR(entry.receivables || 0)}</p>
              </div>
              <div>
                <p className="text-[8px] text-white/20 font-black uppercase tracking-widest">Liabilities</p>
                <p className="text-[11px] text-rose-400/60 font-bold">-{formatINR(entry.liabilities || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (sortedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center">
          <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div>
          <h3 className="text-white/40 font-bold text-sm">No growth data yet</h3>
          <p className="text-white/10 text-xs">Save your first portfolio snapshot to start tracking growth.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] md:h-[500px] mt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={sortedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="white" opacity={0.03} />
          <XAxis 
            dataKey="monthYear" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 700 }}
            dy={10}
            interval="preserveStartEnd"
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 700 }}
            tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
          <Area 
            type="monotone" 
            dataKey="totalNetWorth" 
            stroke="#3b82f6" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorNetWorth)" 
            animationDuration={2500}
            style={{ filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.3))' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
