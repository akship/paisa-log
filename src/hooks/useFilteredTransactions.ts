"use client";

import { useMemo } from "react";
import { isWithinInterval, startOfMonth, endOfMonth, subDays } from "date-fns";
import { Transaction } from "@/lib/firebase/firestore";

export type DatePreset = "specific_month" | "custom";

interface FilterOptions {
  preset: DatePreset;
  selectedMonth: string;
  startDate: Date | null;
  endDate: Date | null;
}

export function useFilteredTransactions(transactions: Transaction[], options: FilterOptions) {
  const { preset, selectedMonth, startDate, endDate } = options;

  const filteredTransactions = useMemo(() => {
    const today = new Date();
    let start: Date;
    let end: Date;

    if (preset === "specific_month") {
      const parts = selectedMonth.split('-');
      if (parts.length === 2) {
        start = startOfMonth(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1));
        end = endOfMonth(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1));
      } else {
        start = startOfMonth(today);
        end = endOfMonth(today);
      }
    } else {
      start = startDate || subDays(today, 30);
      end = endDate || today;
    }
    
    // Create new date objects to avoid mutating original state if any
    const finalStart = new Date(start);
    const finalEnd = new Date(end);
    finalEnd.setHours(23, 59, 59, 999);

    return transactions.filter(tx => isWithinInterval(tx.timestamp, { start: finalStart, end: finalEnd }));
  }, [transactions, preset, selectedMonth, startDate, endDate]);

  return filteredTransactions;
}
