"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/firebase/auth";
import { 
  subscribeToTransactions, 
  Transaction, 
  subscribeToPortfolioHistory, 
  PortfolioItem, 
  PortfolioSnapshot,
  UserPreferences,
  getUserPreferences
} from "@/lib/firebase/firestore";
import { useMemo } from "react";
import { startOfMonth, eachMonthOfInterval, format } from "date-fns";
import { BASE_EXPENSE_CATEGORIES, BASE_INCOME_CATEGORIES } from "./constants";


// ---------------------------------------------------------------------------

interface DataContextState {
  transactions: Transaction[];
  transactionsLoading: boolean;
  isWarning: boolean;
  error: string | null;
  preferences: UserPreferences | null;
  categories: {
    expense: string[];
    income: string[];
  };
  currentMonthStats: {
    income: number;
    expense: number;
    balance: number;
  };
  monthsList: { value: string; label: string }[];
  forceStopLoading: () => void;
  loadMore: () => void;
  loadFullHistory: () => void;
  hasMore: boolean;
  isFullHistoryLoaded: boolean;
}

const DataContext = createContext<DataContextState>({
  transactions: [],
  transactionsLoading: true,
  isWarning: false,
  error: null,
  preferences: null,
  categories: {
    expense: [],
    income: [],
  },
  currentMonthStats: {
    income: 0,
    expense: 0,
    balance: 0,
  },
  monthsList: [],
  forceStopLoading: () => {},
  loadMore: () => {},
  loadFullHistory: () => {},
  hasMore: false,
  isFullHistoryLoaded: false,
});

export const useData = () => useContext(DataContext);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, encryptionKey } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [isWarning, setIsWarning] = useState(false);
  const loadingRef = React.useRef(true);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [displayLimit, setDisplayLimit] = useState(50);
  const [isFullHistoryLoaded, setIsFullHistoryLoaded] = useState(false);
  const [hasMore, setHasMore] = useState(true);


  // Fetch preferences
  useEffect(() => {
    if (!user) {
      setPreferences(null);
      return;
    }

    const fetchPrefs = async () => {
      const prefs = await getUserPreferences(user.uid);
      setPreferences(prefs);
    };

    fetchPrefs();
  }, [user]);


  // Single subscription for transactions — shared across Overview + Analytics
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setTransactionsLoading(false);
      setIsWarning(false);
      return;
    }

    loadingRef.current = true;
    setTransactionsLoading(transactions.length === 0);
    setIsWarning(false);
    setError(null);

    // Warning timeout (5 seconds)
    const warningTimeout = setTimeout(() => {
      if (loadingRef.current) {
        console.warn("Slow connection detected: Transactions still loading after 5s");
        setIsWarning(true);
      }
    }, 5000);

    // Safety timeout (10 seconds)
    const errorTimeout = setTimeout(() => {
      if (loadingRef.current) {
        console.warn("Safety timeout triggered: Transactions still loading after 10s");
        setTransactionsLoading(false);
        loadingRef.current = false;
        setError("Your network is blocking the database connection. This is often caused by AdBlockers or strict firewalls. Try disabling extensions for this site.");
      }
    }, 10000);

    let unsubscribe: () => void;

    if (isFullHistoryLoaded) {
      unsubscribe = subscribeToTransactions(
        user.uid,
        (data) => {
          setTransactions(data);
          setTransactionsLoading(false);
          setHasMore(false);
          setIsWarning(false);
          loadingRef.current = false;
        },
        encryptionKey,
        {}, // Options: fetch all
        (err) => {
          setTransactionsLoading(false);
          setError(err.message);
        }
      );
    } else {
      // Optimized mode: Combine latest N + all current month
      const startOfCurrentMonth = startOfMonth(new Date());
      let latestData: Transaction[] = [];
      let monthData: Transaction[] = [];

      const updateMerged = () => {
        const merged = Array.from(new Map([...latestData, ...monthData].map(t => [t.id, t])).values())
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        setTransactions(merged);
        setTransactionsLoading(false);
        setIsWarning(false);
        loadingRef.current = false;
        
        // If latest fetch returned less than limit, we reached the end
        if (latestData.length < displayLimit) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      };

      const unsubLatest = subscribeToTransactions(
        user.uid,
        (data) => {
          latestData = data;
          updateMerged();
        },
        encryptionKey,
        { limitCount: displayLimit }
      );

      const unsubMonth = subscribeToTransactions(
        user.uid,
        (data) => {
          monthData = data;
          updateMerged();
        },
        encryptionKey,
        { startDate: startOfCurrentMonth }
      );

      unsubscribe = () => {
        unsubLatest();
        unsubMonth();
      };
    }

    return () => {
      unsubscribe();
      clearTimeout(warningTimeout);
      clearTimeout(errorTimeout);
    };
  }, [user, encryptionKey, displayLimit, isFullHistoryLoaded]);



  const categories = useMemo(() => {
    const expense = preferences?.enabledExpenseCategories || [...BASE_EXPENSE_CATEGORIES];
    const income = preferences?.enabledIncomeCategories || [...BASE_INCOME_CATEGORIES];
    
    return {
      expense: [...expense].sort((a, b) => a.localeCompare(b)),
      income: [...income].sort((a, b) => a.localeCompare(b))
    };
  }, [preferences]);

  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyTx = transactions.filter(t =>
      t.timestamp.getMonth() === currentMonth && t.timestamp.getFullYear() === currentYear
    );

    const income = monthlyTx
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = monthlyTx
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expense,
      balance: income - expense
    };
  }, [transactions]);

  const monthsList = useMemo(() => {
    const now = new Date();
    const currentMonth = startOfMonth(now);
    
    // Fallback/Joining Date bound
    const joinedDate = user?.metadata?.creationTime 
      ? new Date(user.metadata.creationTime) 
      : now;
    const startBound = startOfMonth(joinedDate);

    // Optimized view: Static list based on join date
    if (!isFullHistoryLoaded) {
      const months = [];
      for (let i = 0; i < 24; i++) {
        const d = new Date(currentMonth);
        d.setMonth(d.getMonth() - i);
        if (d < startBound) break;
        months.push({
          value: format(d, "yyyy-MM"),
          label: format(d, "MMMM yyyy")
        });
      }
      return months;
    }

    // Full history mode: Needs earliest transaction date
    const earliestTxDate = transactions.length > 0 
      ? transactions.reduce((min, tx) => tx.timestamp < min ? tx.timestamp : min, transactions[0].timestamp)
      : joinedDate;
    
    const start = startOfMonth(earliestTxDate < joinedDate ? earliestTxDate : joinedDate);
    const end = currentMonth;

    try {
      return eachMonthOfInterval({ start, end }).reverse().map(date => ({
        value: format(date, "yyyy-MM"),
        label: format(date, "MMMM yyyy")
      }));
    } catch (e) {
      return [{ value: format(now, "yyyy-MM"), label: format(now, "MMMM yyyy") }];
    }
  }, [isFullHistoryLoaded, user?.metadata?.creationTime, transactions.length > 0 ? transactions[transactions.length-1].id : null]);

  return (
    <DataContext.Provider value={{
      transactions,
      transactionsLoading,
      isWarning,
      error,
      preferences,
      categories,
      currentMonthStats,
      monthsList,
      forceStopLoading: () => {
        setTransactionsLoading(false);
        loadingRef.current = false;
      },
      loadMore: () => {
        if (!isFullHistoryLoaded && hasMore) {
          setDisplayLimit(prev => prev + 50);
        }
      },
      loadFullHistory: () => {
        setIsFullHistoryLoaded(true);
      },
      hasMore,
      isFullHistoryLoaded
    }}>
      {children}
    </DataContext.Provider>
  );
}
