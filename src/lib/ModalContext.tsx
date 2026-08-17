"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Transaction, PortfolioItem, PortfolioCategoryGroup } from "@/lib/firebase/firestore";
import { AlertCircle, Trash2, HelpCircle } from "lucide-react";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => Promise<void> | void;
}

interface ModalContextState {
  // Add/Edit Transaction
  isAddTxOpen: boolean;
  editingTx: Transaction | null;
  openAddTransaction: (initialData?: Transaction | null) => void;
  closeAddTransaction: () => void;

  // Add/Edit Portfolio Item
  isAddPortfolioOpen: boolean;
  editingPortfolioItem: PortfolioItem | null;
  defaultPortfolioGroup?: PortfolioCategoryGroup;
  openAddPortfolio: (group?: PortfolioCategoryGroup, initialData?: PortfolioItem | null) => void;
  closeAddPortfolio: () => void;

  // Confirm Modal
  confirm: (options: ConfirmOptions) => void;
  closeConfirm: () => void;
}

const ModalContext = createContext<ModalContextState>({
  isAddTxOpen: false,
  editingTx: null,
  openAddTransaction: () => {},
  closeAddTransaction: () => {},

  isAddPortfolioOpen: false,
  editingPortfolioItem: null,
  openAddPortfolio: () => {},
  closeAddPortfolio: () => {},

  confirm: () => {},
  closeConfirm: () => {},
});

export const useModal = () => useContext(ModalContext);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [isAddPortfolioOpen, setIsAddPortfolioOpen] = useState(false);
  const [editingPortfolioItem, setEditingPortfolioItem] = useState<PortfolioItem | null>(null);
  const [defaultPortfolioGroup, setDefaultPortfolioGroup] = useState<PortfolioCategoryGroup | undefined>();

  const [confirmConfig, setConfirmConfig] = useState<ConfirmOptions | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const openAddTransaction = useCallback((initialData: Transaction | null = null) => {
    setEditingTx(initialData);
    setIsAddTxOpen(true);
  }, []);

  const closeAddTransaction = useCallback(() => {
    setIsAddTxOpen(false);
    setEditingTx(null);
  }, []);

  const openAddPortfolio = useCallback((group?: PortfolioCategoryGroup, initialData: PortfolioItem | null = null) => {
    setDefaultPortfolioGroup(group);
    setEditingPortfolioItem(initialData);
    setIsAddPortfolioOpen(true);
  }, []);

  const closeAddPortfolio = useCallback(() => {
    setIsAddPortfolioOpen(false);
    setEditingPortfolioItem(null);
    setDefaultPortfolioGroup(undefined);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    setConfirmConfig(options);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmConfig(null);
    setIsConfirming(false);
  }, []);

  const handleConfirmAction = async () => {
    if (!confirmConfig) return;
    setIsConfirming(true);
    try {
      await confirmConfig.onConfirm();
      closeConfirm();
    } catch (err) {
      console.error("Confirmation action error:", err);
      setIsConfirming(false);
    }
  };

  return (
    <ModalContext.Provider
      value={{
        isAddTxOpen,
        editingTx,
        openAddTransaction,
        closeAddTransaction,

        isAddPortfolioOpen,
        editingPortfolioItem,
        defaultPortfolioGroup,
        openAddPortfolio,
        closeAddPortfolio,

        confirm,
        closeConfirm,
      }}
    >
      {children}

      {/* Global Accessible Confirmation Modal */}
      {confirmConfig && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-background/85 backdrop-blur-xl transition-opacity animate-in fade-in duration-300"
            onClick={closeConfirm}
          />
          <div className="relative w-full max-w-md glass-card rounded-[2.5rem] border border-white/10 p-8 shadow-2xl bg-surface-container/95 backdrop-blur-[60px] animate-in zoom-in-95 fade-in duration-300 z-10">
            <div className="flex flex-col items-center text-center space-y-5">
              <div className={`p-4 rounded-3xl border shadow-2xl ${
                confirmConfig.variant === "danger" 
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400" 
                  : confirmConfig.variant === "warning"
                  ? "bg-tertiary/10 border-tertiary/20 text-tertiary"
                  : "bg-primary/10 border-primary/20 text-primary"
              }`}>
                {confirmConfig.variant === "danger" ? (
                  <Trash2 className="h-8 w-8" />
                ) : confirmConfig.variant === "warning" ? (
                  <AlertCircle className="h-8 w-8" />
                ) : (
                  <HelpCircle className="h-8 w-8" />
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black font-display tracking-tight text-white">
                  {confirmConfig.title}
                </h3>
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed max-w-xs">
                  {confirmConfig.message}
                </p>
              </div>

              <div className="flex gap-3 w-full pt-2">
                <button
                  type="button"
                  onClick={closeConfirm}
                  disabled={isConfirming}
                  className="flex-1 py-3.5 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all border border-white/5 disabled:opacity-50 cursor-pointer"
                >
                  {confirmConfig.cancelText || "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={isConfirming}
                  className={`flex-1 py-3.5 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer ${
                    confirmConfig.variant === "danger"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
                      : "bg-primary text-black hover:scale-105"
                  }`}
                >
                  {isConfirming ? (
                    <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    confirmConfig.confirmText || "Confirm"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </ModalContext.Provider>
  );
}
