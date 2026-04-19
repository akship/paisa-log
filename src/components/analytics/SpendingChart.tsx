"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from "recharts";
import { formatINR } from "@/lib/utils";
import { useState } from "react";

interface ChartEntry {
  name: string;
  value: number;
  color: string;
  type: string;
}

interface SpendingChartProps {
  title: string;
  chartData: ChartEntry[];
  expenseTotal: number;
  hasSavings: boolean;
}

export const renderActiveShape = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  
  return (
    <g>
      <defs>
        <filter id="activeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur" />
          <feOffset dx="0" dy="8" result="offsetBlur" />
          <feComposite in="SourceGraphic" in2="offsetBlur" operator="over" />
        </filter>
      </defs>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        filter="url(#activeShadow)"
        style={{ transition: 'all 0.3s ease' }}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 14}
        fill={fill}
        opacity={0.3}
      />
    </g>
  );
};

export const CustomTooltip = ({ active, payload, total }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-card border-white/10 p-4 rounded-2xl shadow-2xl bg-[#060912]/90 backdrop-blur-xl animate-in fade-in zoom-in duration-200">
        <p className="text-white/40 font-bold text-[10px] uppercase tracking-widest mb-1">{data.name}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-white font-display text-2xl font-bold tracking-tight">
            {formatINR(data.value)}
          </p>
          {total > 0 && (
            <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
              {((data.value / total) * 100).toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function SpendingChart({ title, chartData, expenseTotal, hasSavings }: SpendingChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, color, index }: any) => {
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const radius = activeIndex === index ? outerRadius + 15 : outerRadius + 5;
    const sx = cx + radius * cos;
    const sy = cy + radius * sin;
    const mx = cx + (radius + 8) * cos;
    const my = cy + (radius + 8) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 12;
    const ey = my;
    const textAnchor = cos >= 0 ? "start" : "end";

    return (
      <g opacity={activeIndex !== null && activeIndex !== index ? 0.3 : 1} style={{ transition: 'all 0.3s ease' }}>
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={color} fill="none" strokeWidth={1} opacity={0.3} />
        <circle cx={ex} cy={ey} r={2} fill={color} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 6} y={ey} textAnchor={textAnchor} fill="white" className="text-[9px] font-black uppercase tracking-widest opacity-60">
          {name}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 6} y={ey} dy={12} textAnchor={textAnchor} fill="white" className="text-[9px] font-bold opacity-30">
          {(percent * 100).toFixed(0)}%
        </text>
      </g>
    );
  };


  return (
    <div className="hidden xl:flex xl:col-span-7 glass-card rounded-[3rem] border-white/5 p-8 md:p-12 relative flex-col min-h-[500px] md:min-h-[600px] animate-in fade-in duration-1000">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">{title}</h2>
        <div className="flex items-center gap-2">
          <div className={`h-1.5 w-1.5 rounded-full ${hasSavings ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"}`} />
          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{hasSavings ? "Surplus" : "Deficit"}</span>
        </div>
      </div>

      <div className="w-full" style={{ height: 460 }}>
        <ResponsiveContainer width="100%" height={460}>
          <PieChart margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
            <Tooltip content={<CustomTooltip total={expenseTotal} />} cursor={false} />
            <Pie
              data={chartData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius="42%"
              outerRadius="58%"
              paddingAngle={4}
              cornerRadius={0}
              stroke="none"
              startAngle={90}
              endAngle={-270}
              animationDuration={1500}
              isAnimationActive={true}
              labelLine={false}
              label={renderCustomLabel}
              /* @ts-expect-error: Recharts Pie component has a type mismatch for activeIndex in some versions */
              activeIndex={activeIndex ?? undefined}
              activeShape={renderActiveShape}
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  fillOpacity={activeIndex === index ? 1 : 0.7}
                  className="transition-all duration-500 cursor-pointer"
                  style={{ 
                    filter: activeIndex === index ? `drop-shadow(0 0 20px ${entry.color}40)` : `drop-shadow(0 0 10px ${entry.color}10)` 
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
