"use client";

import { useState, useEffect } from "react";
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

type ChartEntry = PortfolioSnapshot & { delta: number | null; pct: number | null };

interface GrowthChartProps {
  data: PortfolioSnapshot[];
}

export default function GrowthChart({ data }: GrowthChartProps) {
  // Sort data by timestamp and filter out un-decryptable snapshots
  const rawSorted = [...data]
    .filter(s => s.totalNetWorth !== -1)
    .sort((a, b) => a.monthYear.localeCompare(b.monthYear));

  // Enrich each point with delta / pct vs. previous snapshot
  const sortedData: ChartEntry[] = rawSorted.map((s, i) => {
    if (i === 0) return { ...s, delta: null, pct: null };
    const prev = rawSorted[i - 1].totalNetWorth;
    const delta = s.totalNetWorth - prev;
    const pct = prev !== 0 ? (delta / prev) * 100 : null;
    return { ...s, delta, pct };
  });


  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry: ChartEntry = payload[0].payload;
      const isUp = entry.delta !== null && entry.delta >= 0;
      const deltaColor = entry.delta === null ? '' : isUp ? 'text-emerald-400' : 'text-rose-400';
      return (
      <div className="glass-card border-white/10 p-5 rounded-3xl shadow-2xl bg-background/95 backdrop-blur-2xl animate-in fade-in zoom-in duration-200 min-w-[220px]">
          <p className="text-white/40 font-bold text-[10px] uppercase tracking-widest mb-3">
            {entry.monthYear}
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Net Worth</span>
              <span className="text-blue-400 font-display font-black tracking-tight">{formatINR(entry.totalNetWorth)}</span>
            </div>

            {entry.delta !== null && entry.pct !== null && (
              <div className={`flex items-center justify-between gap-4 px-3 py-2 rounded-xl ${isUp ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                <span className="text-[9px] text-white/30 font-black uppercase tracking-widest">vs prev</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-black ${deltaColor}`}>
                    {isUp ? '▲' : '▼'} {formatINR(Math.abs(entry.delta))}
                  </span>
                  <span className={`text-[10px] font-black ${deltaColor} opacity-70`}>
                    ({isUp ? '+' : ''}{entry.pct.toFixed(1)}%)
                  </span>
                </div>
              </div>
            )}
            
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

  // Custom dot that shows % change label above each data point (skip first)
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props as { cx: number; cy: number; payload: ChartEntry };
    if (payload.pct === null) {
      return <circle cx={cx} cy={cy} r={4} fill="#3b82f6" stroke="rgba(59,130,246,0.3)" strokeWidth={6} />;
    }
    const isUp = payload.pct >= 0;
    const label = `${isUp ? '+' : ''}${payload.pct.toFixed(1)}%`;
    const color = isUp ? '#34d399' : '#f87171';
    return (
      <g>
        <circle cx={cx} cy={cy} r={4} fill="#3b82f6" stroke="rgba(59,130,246,0.3)" strokeWidth={6} />
        <text
          x={cx}
          y={cy - 14}
          textAnchor="middle"
          fontSize={9}
          fontWeight={800}
          fill={color}
          style={{ letterSpacing: '0.04em' }}
        >
          {label}
        </text>
      </g>
    );
  };

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  if (!isMounted) {
    return <div className="w-full h-[400px] md:h-[500px] mt-8" />;
  }

  return (
    <div className="w-full h-[400px] md:h-[500px] mt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 min-w-0 min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={100}>
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
            dot={<CustomDot />}
            activeDot={{ r: 6, fill: '#3b82f6', stroke: 'rgba(59,130,246,0.4)', strokeWidth: 8 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
