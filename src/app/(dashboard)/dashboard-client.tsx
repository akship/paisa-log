"use client";

import { useEffect, useState } from "react";
import { Transaction, deleteTransaction } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/auth";
import { useData } from "@/lib/DataContext";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import PageHeader from "@/components/layout/PageHeader";
import SummaryGrid from "@/components/dashboard/SummaryGrid";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import PageLoading from "@/components/layout/PageLoading";

import { useModal } from "@/lib/ModalContext";

function DashboardContent() {
  const { user } = useAuth();
  const { 
    transactions,
    transactionsLoading: loading, 
    error, 
    isWarning, 
    forceStopLoading, 
    preferences 
  } = useData();

  const { isAddTxOpen, editingTx, openAddTransaction, closeAddTransaction, confirm } = useModal();

  const displayName = preferences?.customDisplayName || user?.displayName?.split(' ')[0] || 'User';

  const handleEdit = (tx: Transaction) => {
    openAddTransaction(tx);
  };

  const handleDeleteClick = (tx: Transaction) => {
    if (!tx.id) return;
    const txId = tx.id;
    confirm({
      title: "Expunge Record",
      message: `Are you sure you want to delete "${tx.description || tx.category}"? This action cannot be undone.`,
      confirmText: "Delete Record",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteTransaction(txId);
        } catch (err) {
          console.error("Delete error:", err);
          throw err;
        }
      }
    });
  };

  if ((loading && transactions.length === 0) || error) {
    return (
      <PageLoading 
        loading={loading} 
        error={error} 
        isWarning={isWarning} 
        onBypass={() => forceStopLoading()} 
      />
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col space-y-6 md:space-y-10 w-full max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-32">

      <PageHeader
        category="Overview"
        title={<>{greeting}, <span className="text-primary italic">{displayName}</span></>}
        subtitle={<>Your financial pulse <span className="text-white/60">at a glance.</span></>}
      />

      <SummaryGrid />

      <RecentTransactions 
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={closeAddTransaction}
        initialData={editingTx}
      />
    </div>
  );
}

export default function DashboardClient() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <PageLoading loading={true} error={null} message="Initializing workspace..." />;
  }

  return <DashboardContent />;
}
