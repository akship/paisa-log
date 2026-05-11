"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { useAuth } from "@/lib/firebase/auth";
import { 
  subscribeToPortfolio, 
  subscribeToPortfolioHistory, 
  PortfolioItem, 
  PortfolioSnapshot,
  calculatePortfolioTotals
} from "@/lib/firebase/firestore";

interface PortfolioContextState {
  portfolioItems: PortfolioItem[];
  portfolioHistory: PortfolioSnapshot[];
  portfolioLoading: boolean;
  error: string | null;
  historyLimit: number | undefined;
  loadPortfolioData: () => void;
  loadLimitedHistory: (limit: number) => void;
  loadFullHistory: () => void;
  // Summary Metrics
  netWorth: number;
  liquid: number;
  investments: number;
  receivables: number;
  liabilities: number;
  momChange: number;
  momPercent: number;
  overallGrowth: number;
  // Snapshot Status
  snapshotsThisMonth: number;
  canTakeSnapshot: boolean;
  validHistory: PortfolioSnapshot[];
  growthData: any[]; // Combined history + live data for charts
}

const PortfolioContext = createContext<PortfolioContextState>({
  portfolioItems: [],
  portfolioHistory: [],
  portfolioLoading: true,
  error: null,
  historyLimit: undefined,
  loadPortfolioData: () => {},
  loadLimitedHistory: () => {},
  loadFullHistory: () => {},
  netWorth: 0,
  liquid: 0,
  investments: 0,
  receivables: 0,
  liabilities: 0,
  momChange: 0,
  momPercent: 0,
  overallGrowth: 0,
  snapshotsThisMonth: 0,
  canTakeSnapshot: false,
  validHistory: [],
  growthData: [],
});

export const usePortfolio = () => useContext(PortfolioContext);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const { user, encryptionKey } = useAuth();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioSnapshot[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyLimit, setHistoryLimit] = useState<number | undefined>(3);
  const [shouldLoadPortfolio, setShouldLoadPortfolio] = useState(false);

  const loadPortfolioData = useCallback(() => {
    setShouldLoadPortfolio(true);
  }, []);

  const loadLimitedHistory = useCallback((limit: number) => {
    setHistoryLimit(prev => (prev === undefined || prev >= limit) ? prev : limit);
  }, []);

  const loadFullHistory = useCallback(() => {
    setHistoryLimit(undefined);
  }, []);

  useEffect(() => {
    if (!user || !shouldLoadPortfolio) {
      if (!user) {
        setPortfolioItems([]);
        setPortfolioHistory([]);
        setPortfolioLoading(false);
      }
      return;
    }

    setPortfolioLoading(true);
    let loadedPortfolio = false;
    let loadedHistory = false;

    const checkDone = () => {
      if (loadedPortfolio && loadedHistory) setPortfolioLoading(false);
    };

    const unsubPortfolio = subscribeToPortfolio(user.uid, (data) => {
      setPortfolioItems(data);
      loadedPortfolio = true;
      setError(null);
      checkDone();
    }, encryptionKey, (err) => {
      console.error("Firestore Portfolio Items subscription error:", err);
      setError(err.message || "Failed to sync portfolio items");
      setPortfolioLoading(false);
    });

    const unsubHistory = subscribeToPortfolioHistory(user.uid, (data) => {
      // Data from firestore is desc, but metrics/charts expect asc
      const sorted = [...data].sort((a, b) => a.monthYear.localeCompare(b.monthYear));
      setPortfolioHistory(sorted);
      loadedHistory = true;
      setError(null);
      checkDone();
    }, encryptionKey, { limitCount: historyLimit }, (err) => {
      console.error("Firestore Portfolio Snapshots subscription error:", err);
      setError(err.message || "Failed to sync portfolio history");
      setPortfolioLoading(false);
    });

    return () => {
      unsubPortfolio();
      unsubHistory();
    };
  }, [user, encryptionKey, shouldLoadPortfolio, historyLimit]);

  const totals = useMemo(() => {
    return calculatePortfolioTotals(portfolioItems);
  }, [portfolioItems]);

  const metrics = useMemo(() => {
    if (portfolioHistory.length === 0) {
      return {
        validHistory: [],
        snapshotsThisMonth: 0,
        canTakeSnapshot: true,
        momChange: 0,
        momPercent: 0,
        overallGrowth: 0,
        growthData: []
      };
    }

    const currentMonthYear = format(new Date(), "yyyy-MM");
    
    // Sort history once for all subsequent calculations
    const sortedHistory = [...portfolioHistory].sort((a, b) => a.monthYear.localeCompare(b.monthYear));
    const validHistory = sortedHistory.filter(s => s.totalNetWorth !== -1);

    // Calc month snapshots efficiently
    let snapshotsThisMonth = 0;
    let previousSnapshot = null;
    const monthlyMap: Record<string, any> = {};

    for (let i = 0; i < sortedHistory.length; i++) {
      const s = sortedHistory[i];
      if (s.monthYear === currentMonthYear) {
        snapshotsThisMonth++;
      } else {
        // Keep track of the most recent non-current-month snapshot
        previousSnapshot = s;
      }
      if (s.totalNetWorth !== -1) {
        monthlyMap[s.monthYear] = s;
      }
    }

    const momChange = previousSnapshot ? totals.totalNetWorth - previousSnapshot.totalNetWorth : 0;
    const momPercent = previousSnapshot && previousSnapshot.totalNetWorth !== 0 
      ? (momChange / previousSnapshot.totalNetWorth) * 100 
      : 0;

    const overallGrowth = validHistory.length > 0 
      ? totals.totalNetWorth - validHistory[0].totalNetWorth 
      : 0;

    // Promote live data to the end of the trajectory
    monthlyMap[currentMonthYear] = {
      id: "live",
      user_id: user?.uid || "temp",
      monthYear: currentMonthYear,
      totalNetWorth: totals.totalNetWorth,
      liquid: totals.liquid,
      investments: totals.investments,
      receivables: totals.receivables,
      liabilities: totals.liabilities,
      timestamp: new Date(),
      isEncrypted: false,
      v: 1
    };

    const growthData = Object.values(monthlyMap).sort((a: any, b: any) =>
      a.monthYear.localeCompare(b.monthYear)
    );

    return {
      validHistory,
      snapshotsThisMonth,
      canTakeSnapshot: snapshotsThisMonth < 2,
      momChange,
      momPercent,
      overallGrowth,
      growthData
    };
  }, [portfolioHistory, totals, user?.uid]);

  return (
    <PortfolioContext.Provider value={{
      portfolioItems,
      portfolioHistory,
      portfolioLoading,
      error,
      loadPortfolioData,
      loadLimitedHistory,
      loadFullHistory,
      historyLimit,
      netWorth: totals.totalNetWorth,
      liquid: totals.liquid,
      investments: totals.investments,
      receivables: totals.receivables,
      liabilities: totals.liabilities,
      ...metrics
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}
