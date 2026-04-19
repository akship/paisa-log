"use client";

import { Calendar, Activity, ChevronDown } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PageHeader from "@/components/layout/PageHeader";
import CustomDateModal from "./CustomDateModal";
import { useState } from "react";

export type AnalyticsTab = "spending" | "growth";
export type DatePreset = "specific_month" | "custom";

interface AnalyticsHeaderProps {
  activeTab: AnalyticsTab;
  setActiveTab: (tab: AnalyticsTab) => void;
  preset: DatePreset;
  setPreset: (preset: DatePreset) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  monthsList: { value: string; label: string }[];
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;
  isMonthPickerOpen: boolean;
  setIsMonthPickerOpen: (open: boolean) => void;
  onClearCategory?: () => void;
}

export default function AnalyticsHeader({
  activeTab,
  setActiveTab,
  preset,
  setPreset,
  selectedMonth,
  setSelectedMonth,
  monthsList,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  isMonthPickerOpen,
  setIsMonthPickerOpen,
  onClearCategory
}: AnalyticsHeaderProps) {
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const selectedMonthLabel = monthsList.find(m => m.value === selectedMonth)?.label || "Select Month";

  return (
    <div className="relative z-[61] flex flex-col gap-6 mb-8 animate-in slide-in-from-top-4 duration-700 -mt-2">
      {/* Top Row: Title & Primary Controls */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-2 group/cat">
            <div className="h-[2px] w-7 bg-primary rounded-full group-hover/cat:w-10 transition-all duration-300" />
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">
              Analytics
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-display text-white tracking-tighter leading-none mb-4">
            Wealth Insights
          </h1>
          <p className="text-white/40 text-sm md:text-lg font-medium font-display tracking-tight">
            Capital allocation <span className="text-white font-bold">and balance insights.</span>
          </p>
        </div>

        {/* Stacked Controls Cluster */}
        <div className="flex flex-col items-end gap-3 shrink-0 pt-2">
          {/* Spend vs Growth Toggle - High Contrast Theme */}
          <div className="flex p-1 bg-white/[0.03] border border-white/5 rounded-2xl backdrop-blur-3xl shadow-2xl">
            {(["spending", "growth"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === "growth" && onClearCategory) onClearCategory();
                }}
                className={`px-8 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 whitespace-nowrap active:scale-95 ${
                  activeTab === tab
                    ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                    : "text-white/30 hover:text-white/60"
                }`}
              >
                {tab === "spending" ? "Spend" : "Growth"}
              </button>
            ))}
          </div>

          {/* Date Selectors Row - Hide on Growth View */}
          {activeTab === "spending" && (
            <div className="flex items-center gap-2">
              {/* Month Dropdown Button Style */}
              <div className="relative group/month">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreset("specific_month");
                    setIsMonthPickerOpen(!isMonthPickerOpen);
                  }}
                  className={`relative flex items-center gap-3 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all border border-white/5 backdrop-blur-3xl ${
                    isMonthPickerOpen ? "z-50" : "z-auto"
                  } ${
                    preset === "specific_month"
                      ? "bg-white/[0.05] text-white border-white/20 shadow-xl"
                      : "bg-white/[0.02] text-white/30 hover:text-white/60 hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="uppercase">{selectedMonthLabel}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-500 ${isMonthPickerOpen ? "text-primary rotate-180" : "text-white/20"}`} />
                </button>

                {/* Dropdown Menu */}
                {isMonthPickerOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsMonthPickerOpen(false)} 
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-[#0a0a0b] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-3xl z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                      <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {monthsList.map((m) => (
                          <button
                            key={m.value}
                            onClick={() => {
                              setSelectedMonth(m.value);
                              setIsMonthPickerOpen(false);
                            }}
                            className={`w-full px-6 py-2.5 text-left text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-white/[0.03] ${
                              selectedMonth === m.value ? "text-primary" : "text-white/40 hover:text-white/70"
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setIsCustomModalOpen(true)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all border border-white/5 backdrop-blur-3xl ${
                  preset === "custom"
                    ? "bg-white/[0.05] text-white border-white/20 shadow-xl"
                    : "bg-white/[0.02] text-white/30 hover:text-white/60 hover:bg-white/[0.05]"
                }`}
              >
                Custom
              </button>
            </div>
          )}
        </div>
      </div>

      <CustomDateModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onApply={() => {
          setPreset("custom");
          setIsCustomModalOpen(false);
        }}
      />
    </div>
  );
}

