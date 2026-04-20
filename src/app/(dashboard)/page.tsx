"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Plus, ArrowUpRight, ArrowDownRight, IndianRupee, History, Edit2, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { Transaction, deleteTransaction } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/auth";
import { useData } from "@/lib/DataContext";
import { format } from "date-fns";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import DeleteConfirmModal from "@/components/transactions/DeleteConfirmModal";
import { BASE_EXPENSE_CATEGORIES, BASE_INCOME_CATEGORIES } from "@/lib/constants";
import { Search, Filter, Layers, ListFilter, Tag, ChevronDown } from "lucide-react";
import { useMemo } from "react";
import PageHeader from "@/components/layout/PageHeader";
import SummaryGrid from "@/components/dashboard/SummaryGrid";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import PageLoading from "@/components/layout/PageLoading";

export default function OverviewPage() {
  const { user } = useAuth();
  const { 
    transactions,
    transactionsLoading: loading, 
    error, 
    isWarning, 
    forceStopLoading, 
    preferences 
  } = useData();

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const displayName = preferences?.customDisplayName || user?.displayName?.split(' ')[0] || 'User';

  // Handle Global FAB Action
  useEffect(() => {
    const handleOpenModal = () => setIsAddModalOpen(true);
    window.addEventListener('pl-open-add-transaction', handleOpenModal);
    return () => window.removeEventListener('pl-open-add-transaction', handleOpenModal);
  }, []);

  const handleEdit = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTransaction?.id) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(selectedTransaction.id);
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete transaction");
    } finally {
      setIsDeleting(false);
      setSelectedTransaction(null);
    }
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
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedTransaction(null);
        }}
        initialData={selectedTransaction}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedTransaction(null);
        }}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </div>
  );
}
