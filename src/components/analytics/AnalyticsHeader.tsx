"use client";

import { Calendar, Activity, ChevronDown, CheckCircle2 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PageHeader from "@/components/layout/PageHeader";
import { useState, forwardRef } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

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

const HeaderDateInput = forwardRef(({ value, onClick, placeholder }: any, ref: any) => (
  <button
    onClick={onClick}
    ref={ref}
    className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2 text-left hover:bg-white/[0.06] transition-all active:scale-95 min-w-[140px]"
  >
    <Calendar className="h-3.5 w-3.5 text-primary opacity-40 shrink-0" />
    <span className={`text-[10px] md:text-xs font-bold md:font-black uppercase tracking-wider ${value ? 'text-white' : 'text-white/20'}`}>
      {value || placeholder}
    </span>
  </button>
));

HeaderDateInput.displayName = "HeaderDateInput";

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
  const [isRangeSelectorVisible, setIsRangeSelectorVisible] = useState(false);
  const selectedMonthLabel = monthsList.find(m => m.value === selectedMonth)?.label || "Select Month";

  const dateRangeLabel = preset === 'custom' && startDate && endDate
    ? `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`
    : 'Custom';

  return (
    <div className="relative z-[61] flex flex-col gap-4 mb-4 animate-in slide-in-from-top-4 duration-700 -mt-2">
      {/* Top Row: Title & Primary Controls */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 group/cat">
            <div className="h-[1.5px] w-5 bg-primary rounded-full group-hover/cat:w-8 transition-all duration-300" />
            <span className="text-[8px] md:text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">
              Analytics
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black font-display text-white tracking-tighter leading-none mb-2">
            Wealth Insights
          </h1>
          <p className="text-white/40 text-[10px] md:text-lg font-medium font-display tracking-tight">
            Capital allocation <span className="text-white font-bold">and balance insights.</span>
          </p>
        </div>

        {/* Stacked Controls Cluster */}
        <div className="flex flex-col items-end gap-2 shrink-0 pt-1">
          {/* Spend vs Growth Toggle - High Contrast Theme */}
          <div className="flex p-1 bg-white/[0.03] border border-white/5 rounded-xl backdrop-blur-3xl shadow-2xl">
            {(["spending", "growth"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === "growth" && onClearCategory) onClearCategory();
                }}
                className={`px-6 md:px-8 py-1.5 md:py-2.5 text-[10px] md:text-xs font-bold md:font-black uppercase tracking-[0.15em] md:tracking-[0.2em] rounded-lg transition-all duration-500 whitespace-nowrap active:scale-95 ${activeTab === tab
                  ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  : "text-white/30 hover:text-white/60"
                  }`}
              >
                {tab === "spending" ? "Spend" : "Growth"}
              </button>
            ))}
          </div>

          {/* Date Selectors Row - Hide on Growth View */}
          {activeTab === "spending" && (
            <div className="flex items-center gap-1">
              {/* Month Dropdown Button Style */}
              <div className="relative group/month">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreset("specific_month");
                    setIsMonthPickerOpen(!isMonthPickerOpen);
                  }}
                  className={`relative flex items-center gap-2 px-6 py-2 md:px-6 md:py-2.5 rounded-lg text-[10px] md:text-xs font-bold md:font-black uppercase tracking-[0.15em] md:tracking-[0.2em] transition-all border border-white/5 backdrop-blur-3xl ${isMonthPickerOpen ? "z-50" : "z-auto"
                    } ${preset === "specific_month"
                      ? "bg-white/[0.05] text-white border-white/20 shadow-xl"
                      : "bg-white/[0.02] text-white/30 hover:text-white/60 hover:bg-white/[0.05]"
                    }`}
                >
                  <span className="uppercase">{selectedMonthLabel}</span>
                  <ChevronDown className={`h-3 w-3 md:h-4 md:w-4 transition-transform duration-500 ${isMonthPickerOpen ? "text-primary rotate-180" : "text-white/20"}`} />
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
                            className={`w-full px-6 py-2.5 text-left text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all hover:bg-white/[0.03] ${selectedMonth === m.value ? "text-primary" : "text-white/40 hover:text-white/70"
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
                onClick={() => setIsRangeSelectorVisible(!isRangeSelectorVisible)}
                className={`flex items-center gap-2 px-6 py-2 md:px-6 md:py-2.5 rounded-lg text-[10px] md:text-xs font-bold md:font-black uppercase tracking-[0.15em] md:tracking-[0.2em] transition-all border border-white/5 backdrop-blur-3xl shadow-2xl active:scale-95 ${preset === "custom" || isRangeSelectorVisible
                  ? "bg-white/[0.05] text-white border-white/20 shadow-xl"
                  : "bg-white/[0.02] text-white/30 hover:text-white/60 hover:bg-white/[0.05]"
                  }`}
              >
                {dateRangeLabel}
                <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${isRangeSelectorVisible ? "rotate-180" : ""}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isRangeSelectorVisible && activeTab === "spending" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden -mt-6"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-end gap-3 pt-0 pb-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Timeline Start</span>
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  dateFormat="MMM d, yyyy"
                  customInput={<HeaderDateInput />}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  popperPlacement="bottom-end"
                />
              </div>

              <div className="hidden md:block h-[1px] w-4 bg-white/5 mt-5" />

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Timeline End</span>
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate || undefined}
                  dateFormat="MMM d, yyyy"
                  customInput={<HeaderDateInput />}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  popperPlacement="bottom-end"
                />
              </div>

              <div className="flex items-end h-full">
                <button
                  onClick={() => {
                    setPreset("custom");
                    setIsRangeSelectorVisible(false);
                  }}
                  className="flex items-center gap-2 bg-primary text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all mt-4 md:mt-5 shadow-glow-primary"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 stroke-[3px]" />
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

