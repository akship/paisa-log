"use client";

import { useState, useEffect, Suspense } from "react";
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

function AnalyticsParamsHandler({ onTabChange }: { onTabChange: (tab: AnalyticsTab) => void }) {
  return (
    <Suspense fallback={null}>
      <AnalyticsParamsInner onTabChange={onTabChange} />
    </Suspense>
  );
}

function AnalyticsParamsInner({ onTabChange }: { onTabChange: (tab: AnalyticsTab) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'growth' || tab === 'spending') {
      onTabChange(tab as AnalyticsTab);
    }
  }, [searchParams, onTabChange]);
  return null;
}

function AnalyticsContent() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

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

  // States
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("spending");
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
    loadPortfolioData();
  }, [loadPortfolioData]);

  useEffect(() => {
    if ((selectedMonth && selectedMonth !== currentMonthYear) || preset === "custom") {
      loadFullHistory();
    }
  }, [selectedMonth, currentMonthYear, preset, loadFullHistory]);

  useEffect(() => {
    if (activeTab === "growth") {
      loadLimitedPortfolioHistory(6);
    }
  }, [activeTab, loadLimitedPortfolioHistory]);

  useEffect(() => {
    if (monthsList.length > 0 && !selectedMonth) {
      setSelectedMonth(monthsList[0].value);
    }
  }, [monthsList, selectedMonth]);

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

  if (!isMounted) {
    return (
      <div className="flex flex-col space-y-6 w-full max-w-[1600px] mx-auto pb-32">
        <div className="h-48 w-full glass-card rounded-[3rem] animate-pulse bg-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 glass-card rounded-3xl animate-pulse bg-white/5" />
          ))}
        </div>
        <div className="h-[400px] glass-card rounded-[40px] animate-pulse bg-white/5" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 w-full max-w-[1600px] mx-auto selection:bg-blue-500/30 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-32">
      <Suspense fallback={null}>
        <AnalyticsParamsHandler onTabChange={setActiveTab} />
      </Suspense>

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
    </div>
  );
}

export default function AnalyticsClient() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  if (!isMounted) {
    return (
      <div className="flex flex-col space-y-6 w-full max-w-[1600px] mx-auto pb-32">
        <div className="h-48 w-full glass-card rounded-[3rem] animate-pulse bg-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 glass-card rounded-3xl animate-pulse bg-white/5" />
          ))}
        </div>
        <div className="h-[400px] glass-card rounded-[40px] animate-pulse bg-white/5" />
      </div>
    );
  }

  return <AnalyticsContent />;
}
