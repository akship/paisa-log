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
import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import PageHeader from "@/components/layout/PageHeader";
import SectionHeader from "@/components/layout/SectionHeader";

export default function OverviewPage() {
  const { user, preferences } = useAuth();
  const { transactions, transactionsLoading: loading } = useData();
  const [error, setError] = useState<string | null>(null);

  // Modal & Filter States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCard, setActiveCard] = useState(0);
  const cardsScrollRef = useRef<HTMLDivElement>(null);

  const handleCardsScroll = useCallback(() => {
    const el = cardsScrollRef.current;
    if (!el) return;
    
    // Calculate index based on which card is most visible in the center
    const scrollLeft = el.scrollLeft;
    const containerWidth = el.clientWidth;
    const scrollCenter = scrollLeft + containerWidth / 2;
    
    const children = Array.from(el.children) as HTMLElement[];
    let closestIndex = 0;
    let minDistance = Infinity;

    children.forEach((child, i) => {
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const distance = Math.abs(scrollCenter - childCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    });

    setActiveCard(closestIndex);
  }, []);

  const scrollToCard = (index: number) => {
    const el = cardsScrollRef.current;
    if (!el) return;
    const children = Array.from(el.children) as HTMLElement[];
    const card = children[index];
    if (card) {
      // Adjusted scroll position to keep card centered or properly aligned
      // Taking into account the -mx-6 px-6 container logic
      const targetScroll = card.offsetLeft - 24; 
      el.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const displayName = preferences?.customDisplayName || user?.displayName?.split(' ')[0] || 'User';

  // Handle Global FAB Action
  useEffect(() => {
    const handleOpenModal = () => setIsAddModalOpen(true);
    window.addEventListener('paisa-open-add-transaction', handleOpenModal);
    return () => window.removeEventListener('paisa-open-add-transaction', handleOpenModal);
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

  // Calculate summaries for current month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthTx = transactions.filter(t =>
    t.timestamp.getMonth() === currentMonth && t.timestamp.getFullYear() === currentYear
  );

  const totalIncome = currentMonthTx
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = currentMonthTx
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Filter Logic
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = (tx.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });


  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary shadow-glow-primary"></div>
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest animate-pulse opacity-60">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="glass-card p-10 max-w-md w-full border-red-500/20 text-center">
          <div className="bg-red-500/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-6">
            <Plus className="h-6 w-6 text-red-500 rotate-45" />
          </div>
          <h2 className="text-2xl font-bold mb-3 font-display">System Error</h2>
          <p className="text-on-surface-variant text-sm mb-8 leading-relaxed">
            {error.includes("index")
              ? "The database requires an optimization index. This usually takes a few minutes to build."
              : error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-on-surface text-surface px-6 py-3.5 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all hover:opacity-90"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-10 max-w-7xl mx-auto">

      <PageHeader
        category="Overview"
        title={<>{greeting}, <span className="text-primary italic">{displayName}</span></>}
        subtitle={<>Your financial pulse <span className="text-white/60">at a glance.</span></>}
      />

      {/* Summary Cards Carousel - 400–500px cards, snaps when screen is too small */}
      <div className="flex flex-col gap-6">
        <div
          ref={cardsScrollRef}
          onScroll={handleCardsScroll}
          className="flex gap-5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory -mx-6 px-6"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Main Balance Card */}
          <div className="snap-start shrink-0 w-[min(460px,calc(100vw-48px))] flex flex-col">
            <div className="glass-card p-8 flex flex-col relative overflow-hidden group h-[220px] border-primary/20 bg-primary/[0.03]">
              <div className="absolute -right-8 -top-8 text-primary opacity-[0.05] group-hover:scale-125 group-hover:rotate-12 transition-all duration-1000">
                <IndianRupee className="h-48 w-48" />
              </div>
              <div className="relative z-10 flex flex-col h-full">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 opacity-80">Total Balance</p>
                <h2 className={`text-5xl md:text-6xl font-bold tracking-tighter font-display ${balance < 0 ? 'text-tertiary shadow-glow-tertiary' : 'text-on-surface text-shadow-glow'}`}>
                  <span className="opacity-30 mr-1 font-normal text-2xl translate-y-[-4px] md:translate-y-[-8px] inline-block">₹</span>{formatINR(balance).replace('₹', '')}
                </h2>
                <div className="mt-auto pt-8 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    Live Sync Active
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Income Analysis Card */}
          <Link href="/analytics#transaction-groups" className="snap-start shrink-0 w-[min(460px,calc(100vw-48px))] group/card">
            <div className="glass-card p-8 h-[220px] flex flex-col relative overflow-hidden group border-secondary/10 group-hover/card:border-secondary/30 transition-all duration-500">
              <div className="absolute right-8 top-8 p-3.5 bg-secondary/10 rounded-2xl border border-secondary/20 group-hover/card:scale-110 transition-transform">
                <ArrowDownRight className="h-5 w-5 text-secondary" />
              </div>
              <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] mb-4 opacity-80">Income</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface mb-2 font-display">
                <span className="opacity-20 mr-1 font-normal text-xl translate-y-[-2px] inline-block">₹</span>{formatINR(totalIncome).replace('₹', '')}
              </h2>
              <div className="mt-auto pt-6">
                <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-secondary shadow-glow-secondary w-[70%]" />
                </div>
              </div>
            </div>
          </Link>

          {/* Expense Analysis Card */}
          <Link href="/analytics#transaction-groups" className="snap-start shrink-0 w-[min(460px,calc(100vw-48px))] group/card pr-6">
            <div className="glass-card p-8 h-[220px] flex flex-col relative overflow-hidden group border-tertiary/10 group-hover/card:border-tertiary/30 transition-all duration-500">
              <div className="absolute right-8 top-8 p-3.5 bg-tertiary/10 rounded-2xl border border-tertiary/20 group-hover/card:scale-110 transition-transform">
                <ArrowUpRight className="h-5 w-5 text-tertiary" />
              </div>
              <p className="text-[10px] font-black text-tertiary uppercase tracking-[0.3em] mb-4 opacity-80">Expenses</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface mb-2 font-display">
                <span className="opacity-20 mr-1 font-normal text-xl translate-y-[-2px] inline-block">₹</span>{formatINR(totalExpense).replace('₹', '')}
              </h2>
              <div className="mt-auto pt-6">
                <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-tertiary shadow-glow-tertiary w-[85%]" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Carousel Dots - Dynamic based on cards */}
        <div className="flex items-center justify-center gap-3">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              onClick={() => scrollToCard(i)}
              className={`rounded-full transition-all duration-500 ${
                activeCard === i
                  ? 'w-10 h-1.5 bg-primary shadow-glow-primary'
                  : 'w-1.5 h-1.5 bg-white/10 hover:bg-white/30'
              }`}
              aria-label={`Go to card ${i + 1}`}
            />
          ))}
        </div>
      </div>



      {/* Transactions Section */}
      <div className="flex flex-col space-y-6">
        <SectionHeader
          title="Recent Records"
          actions={
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-50" />
              <input
                type="text"
                placeholder="Filter by description or tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl pl-12 pr-6 py-3.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/30 transition-all"
              />
            </div>
          }
        />


        {/* Master Transaction List */}
        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center glass-card">
              <div className="p-6 bg-white/5 rounded-full mb-6 border border-white/10">
                <Search className="h-10 w-10 text-on-surface-variant/20" />
              </div>
              <h3 className="text-xl font-bold font-display mb-2">No Records Found</h3>
              <p className="text-sm text-on-surface-variant opacity-60 max-w-xs leading-relaxed">
                {searchTerm
                  ? "Adjust your filters to scan a different range of your financial data."
                  : "Start populating your ledger to see your financial pulse in action."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredTransactions.slice(0, 50).map((tx) => (
                <div key={tx.id} className="group relative flex items-center justify-between p-5 glass-card glass-interactive cursor-default">

                  {/* Categorical Side Accent */}
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 rounded-r-full transition-all duration-500 group-hover:h-12 ${tx.type === 'income' ? 'bg-secondary' : 'bg-primary opacity-40 group-hover:opacity-100'}`}></div>

                  <div className="flex items-center gap-6 min-w-0">
                    <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/5 group-hover:border-primary/20 group-hover:bg-primary/5 transition-all duration-500">
                      <IndianRupee className={`h-5 w-5 transition-colors duration-500 ${tx.type === 'income' ? 'text-secondary' : 'text-on-surface-variant opacity-40 group-hover:text-primary group-hover:opacity-100'}`} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-on-surface truncate text-lg tracking-tight group-hover:text-white transition-colors">{tx.description || tx.category}</span>
                      <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">
                        <span className="text-primary/70">{tx.category}</span>
                        <span>•</span>
                        <span>{format(tx.timestamp, "MMM dd, yyyy")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xl md:text-2xl font-bold tracking-tighter font-display whitespace-nowrap text-right ${tx.type === 'income' ? 'text-secondary text-shadow-glow' : 'text-on-surface'}`}>
                      <span className={`opacity-30 font-normal mr-1 text-sm md:text-lg translate-y-[-2px] inline-block`}>{tx.type === 'income' ? '+' : '-'}</span>
                      {formatINR(tx.amount).replace('₹', '')}
                    </span>
                    <div className="flex items-center gap-3 sm:opacity-0 sm:group-hover:opacity-100 transition-all sm:translate-x-4 sm:group-hover:translate-x-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(tx); }}
                        className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-white/5 text-on-surface-variant hover:text-white transition-all"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(tx); }}
                        className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-white/5 text-on-surface-variant hover:text-white transition-all"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
