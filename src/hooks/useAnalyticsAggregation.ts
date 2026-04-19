"use client";

import { useMemo } from "react";
import { Transaction } from "@/lib/firebase/firestore";
import { PRISM_COLORS } from "@/lib/constants";

export function useAnalyticsAggregation(filteredTransactions: Transaction[], dataCategories: { expense: string[], income: string[] }) {
  return useMemo(() => {
    let incomeTotal = 0;
    let expenseTotal = 0;
    const expenseCatSum: Record<string, number> = {};
    const incomeCatSum: Record<string, number> = {};
    const transactionsByCategory: Record<string, Transaction[]> = {};

    for (const tx of filteredTransactions) {
      const amount = tx.amount;
      const isIncome = tx.type === "income";
      
      // Consolidated Category Logic
      // 1. All income goes to "Income"
      // 2. Expenses keep their original category
      const targetCat = isIncome ? "Total Inflow" : tx.category;
      
      if (!transactionsByCategory[targetCat]) transactionsByCategory[targetCat] = [];
      transactionsByCategory[targetCat].push(tx);

      if (isIncome) {
        incomeTotal += amount;
        incomeCatSum[targetCat] = (incomeCatSum[targetCat] || 0) + amount;
      } else {
        expenseTotal += amount;
        expenseCatSum[targetCat] = (expenseCatSum[targetCat] || 0) + amount;
      }
    }

    // Return only active categories
    return { 
      incomeTotal, 
      expenseTotal, 
      expensesByCategory: expenseCatSum, 
      incomeByCategory: incomeCatSum, 
      transactionsByCategory 
    };
  }, [filteredTransactions]);
}
