"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/firebase/auth";
import { 
  subscribeToTransactions, 
  Transaction, 
  subscribeToPortfolio, 
  subscribeToPortfolioHistory, 
  PortfolioItem, 
  PortfolioSnapshot,
} from "@/lib/firebase/firestore";


// ---------------------------------------------------------------------------

interface DataContextState {
  transactions: Transaction[];
  transactionsLoading: boolean;
  portfolioItems: PortfolioItem[];
  portfolioHistory: PortfolioSnapshot[];
  portfolioLoading: boolean;
  loadPortfolioData: () => void;
}

const DataContext = createContext<DataContextState>({
  transactions: [],
  transactionsLoading: true,
  portfolioItems: [],
  portfolioHistory: [],
  portfolioLoading: true,
  loadPortfolioData: () => {},
});

export const useData = () => useContext(DataContext);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, encryptionKey } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioSnapshot[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [shouldLoadPortfolio, setShouldLoadPortfolio] = useState(false);

  const loadPortfolioData = useCallback(() => {
    setShouldLoadPortfolio(true);
  }, []);


  // Single subscription for transactions — shared across Overview + Analytics
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setTransactionsLoading(false);
      return;
    }

    setTransactionsLoading(true);
    const unsubscribe = subscribeToTransactions(
      user.uid,
      (data) => {
        setTransactions(data);
        setTransactionsLoading(false);
      },
      encryptionKey,
      (error) => {
        console.error("Transactions subscription error:", error);
        setTransactionsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, encryptionKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Single subscription for portfolio — shared across Portfolio + NotificationBell
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
      checkDone();
    }, encryptionKey);

    const unsubHistory = subscribeToPortfolioHistory(user.uid, (data) => {
      setPortfolioHistory(data);
      loadedHistory = true;
      checkDone();
    }, encryptionKey);

    return () => {
      unsubPortfolio();
      unsubHistory();
    };
  }, [user, encryptionKey, shouldLoadPortfolio]);

  return (
    <DataContext.Provider value={{
      transactions,
      transactionsLoading,
      portfolioItems,
      portfolioHistory,
      portfolioLoading,
      loadPortfolioData,
    }}>
      {children}
    </DataContext.Provider>
  );
}
