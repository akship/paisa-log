"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth";
import { Transaction } from "@/lib/firebase/firestore";
import { useData } from "@/lib/DataContext";
import { usePortfolio } from "@/lib/PortfolioContext";
import { format } from "date-fns";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import { useFilteredTransactions } from "@/hooks/useFilteredTransactions";
import { useAnalyticsAggregation } from "@/hooks/useAnalyticsAggregation";

import AnalyticsHeader, { AnalyticsTab, DatePreset } from "@/components/analytics/AnalyticsHeader";
import SpendingView from "@/components/analytics/SpendingView";
import GrowthView from "@/components/analytics/GrowthView";
import PageLoading from "@/components/layout/PageLoading";

export default function AnalyticsPage() {
  const { user, encryptionKey } = useAuth();
  const { 
    transactions: rawTransactions, 
    transactionsLoading, 
    categories: dataCategories,
    monthsList,
    error: dataError,
    isWarning,
    forceStopLoading,
    loadFullHistory
  } = useData();

  const {
    portfolioHistory,
    portfolioLoading,
    loadPortfolioData,
    loadLimitedHistory: loadLimitedPortfolioHistory,
    loadFullHistory: loadFullPortfolioHistory,
    netWorth,
    liquid,
    investments,
    receivables,
    liabilities,
    error: portfolioError
  } = usePortfolio();
  
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') === 'growth' ? 'growth' : 'spending') as AnalyticsTab;
  
  // States
  const [activeTab, setActiveTab] = useState<AnalyticsTab>(initialTab);
  const [preset, setPreset] = useState<DatePreset>("specific_month");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("total");
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  const currentMonthYear = format(new Date(), "yyyy-MM");

  // Load necessary data based on tab/selection
  useEffect(() => {
    // Only load portfolio items if not already loaded (live data)
    loadPortfolioData();
  }, [loadPortfolioData]);

  // Load transaction history ONLY if a past month is selected or custom range is active
  useEffect(() => {
    if ((selectedMonth && selectedMonth !== currentMonthYear) || preset === "custom") {
      loadFullHistory();
    }
  }, [selectedMonth, currentMonthYear, preset, loadFullHistory]);

  // Load portfolio history ONLY if growth tab is opened
  useEffect(() => {
    if (activeTab === "growth") {
      loadLimitedPortfolioHistory(6);
    }
  }, [activeTab, loadLimitedPortfolioHistory]);

  // Sync selected month with latest available if not set
  useEffect(() => {
    if (monthsList.length > 0 && !selectedMonth) {
      setSelectedMonth(monthsList[0].value);
    }
  }, [monthsList, selectedMonth]);

  // Hooks for filtered data and aggregation
  const filteredTransactions = useFilteredTransactions(rawTransactions, {
    preset,
    selectedMonth,
    startDate,
    endDate
  });

  const {
    incomeTotal,
    expenseTotal,
    expensesByCategory,
    incomeByCategory,
    transactionsByCategory
  } = useAnalyticsAggregation(filteredTransactions, dataCategories);

  const isLoading = activeTab === "spending" ? transactionsLoading : portfolioLoading;
  const activeError = activeTab === "spending" ? dataError : portfolioError;

  return (
    <div className="flex flex-col space-y-6 w-full max-w-[1600px] mx-auto selection:bg-blue-500/30 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-32">
      
      <AnalyticsHeader 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        preset={preset}
        setPreset={setPreset}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        monthsList={monthsList}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        isMonthPickerOpen={isMonthPickerOpen}
        setIsMonthPickerOpen={setIsMonthPickerOpen}
        onClearCategory={() => setActiveCategoryId("total")}
      />

      {(isLoading && rawTransactions.length === 0 || activeError) ? (
        <PageLoading 
          loading={isLoading} 
          error={activeError} 
          isWarning={isWarning} 
          onBypass={() => forceStopLoading()}
          message={activeTab === "spending" ? "Scanning records..." : "Analyzing trajectory..."}
        />
      ) : activeTab === "spending" ? (
        <SpendingView 
          filteredTransactions={filteredTransactions}
          incomeTotal={incomeTotal}
          expenseTotal={expenseTotal}
          expensesByCategory={expensesByCategory}
          incomeByCategory={incomeByCategory}
          transactionsByCategory={transactionsByCategory}
          activeCategoryId={activeCategoryId}
          setActiveCategoryId={setActiveCategoryId}
          setEditingTx={setEditingTx}
        />
      ) : (
        <GrowthView 
          portfolioHistory={portfolioHistory}
          netWorth={netWorth}
          liquid={liquid}
          investments={investments}
          receivables={receivables}
          liabilities={liabilities}
          userId={user?.uid || ""}
          encryptionKey={encryptionKey}
        />
      )}

      <AddTransactionModal 
        isOpen={!!editingTx} 
        onClose={() => setEditingTx(null)} 
        initialData={editingTx}
      />

      {/* Datepicker Portal mount point */}
      <div id="datepicker-portal" className="relative z-[9999]" />
    </div>
  );
}
