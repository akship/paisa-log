"use client";

import { useState, useMemo } from "react";
import { Search, Filter, IndianRupee, Edit2, Trash2, ChevronDown, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Transaction } from "@/lib/firebase/firestore";
import { useData } from "@/lib/DataContext";
import { formatINR } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import SectionHeader from "@/components/layout/SectionHeader";

interface RecentTransactionsProps {
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

export default function RecentTransactions({ onEdit, onDelete }: RecentTransactionsProps) {
  const { transactions, categories: dataCategories, loadMore, hasMore, transactionsLoading: loading } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(50);

  const filteredTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .filter(tx => {
        const matchesSearch = (tx.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "All" || tx.category === selectedCategory;
        return matchesSearch && matchesCategory;
      });
  }, [transactions, searchTerm, selectedCategory]);

  const displayedTransactions = useMemo(() => {
    return filteredTransactions.slice(0, displayLimit);
  }, [filteredTransactions, displayLimit]);

  const handleShowMore = () => {
    const nextLimit = displayLimit + 50;
    setDisplayLimit(nextLimit);
    
    // If we are reaching the end of currently loaded transactions, trigger a background fetch
    if (nextLimit > transactions.length && hasMore) {
      loadMore();
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <SectionHeader
        title="Recent Records"
        actions={
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-50" />
              <input
                type="text"
                placeholder="Scan records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl pl-12 pr-6 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/30 transition-all"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest ${
                  selectedCategory !== "All" 
                    ? "border-primary/40 bg-primary/10 text-primary shadow-glow-primary/10" 
                    : "border-white/5 bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden md:inline truncate max-w-[80px]">
                  {selectedCategory === "All" ? "Filter" : selectedCategory}
                </span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${showCategoryFilter ? 'rotate-180' : ''}`} />
              </button>

              {showCategoryFilter && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowCategoryFilter(false)} />
                  <div className="absolute right-0 top-full mt-3 w-72 bg-[#0a0f1d]/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-80 overflow-y-auto no-scrollbar flex flex-col gap-5">
                      <button
                        onClick={() => {
                          setSelectedCategory("All");
                          setShowCategoryFilter(false);
                        }}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                          selectedCategory === "All"
                            ? "bg-white text-background shadow-xl"
                            : "text-white/20 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        Show All Records
                      </button>

                      <div className="space-y-2">
                        <h4 className="px-4 text-[9px] font-black text-primary/40 uppercase tracking-[0.3em]">Expense Sectors</h4>
                        <div className="grid grid-cols-1 gap-1">
                          {dataCategories.expense.map(cat => (
                            <button
                              key={cat}
                              onClick={() => {
                                setSelectedCategory(cat);
                                setShowCategoryFilter(false);
                              }}
                              className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                selectedCategory === cat
                                  ? "bg-primary/20 text-primary border border-primary/20"
                                  : "text-white/40 hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="px-4 text-[9px] font-black text-secondary/40 uppercase tracking-[0.3em]">Inflow Sources</h4>
                        <div className="grid grid-cols-1 gap-1">
                          {dataCategories.income.map(cat => (
                            <button
                              key={cat}
                              onClick={() => {
                                setSelectedCategory(cat);
                                setShowCategoryFilter(false);
                              }}
                              className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                selectedCategory === cat
                                  ? "bg-secondary/20 text-secondary border border-secondary/20"
                                  : "text-white/40 hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        }
      />

      <div className="space-y-3 selection:bg-primary/30">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 md:p-20 text-center flex flex-col items-center glass-card border-white/5 bg-white/[0.01] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-50"></div>
            
            <div className="relative mb-10">
              <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-150 animate-pulse"></div>
              <div className="h-24 w-24 relative flex items-center justify-center rounded-[2.5rem] bg-white/5 border border-white/10 shadow-2xl backdrop-blur-3xl group-hover:scale-110 transition-transform duration-1000">
                <div className="absolute inset-0 rounded-[2.5rem] border border-primary/20 animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute inset-2 rounded-[2rem] border border-white/5 animate-[spin_15s_linear_infinite_reverse]"></div>
                <Search className="h-10 w-10 text-primary opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
              </div>
            </div>

            <h3 className="text-2xl font-black font-display mb-3 tracking-tighter text-white drop-shadow-glow">No Records Detected</h3>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-on-surface-variant opacity-40 max-w-[280px] leading-relaxed">
              {searchTerm || selectedCategory !== "All"
                ? "The void remains silent. Adjust your filters to scan a different sector."
                : "Your financial ledger is a clean slate. Begin your journey by adding a record."}
            </p>

            <style jsx>{`
              .drop-shadow-glow {
                filter: drop-shadow(0 0 10px rgba(132,173,255,0.3));
              }
            `}</style>
          </div>
        ) : (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05
                }
              }
            }}
            className="grid grid-cols-1 gap-3"
          >
            <AnimatePresence mode="popLayout">
              {displayedTransactions.map((tx) => (
                <motion.div 
                  key={tx.id}
                  layout
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="group relative flex items-center justify-between px-4 py-3 md:p-3.5 glass-card glass-interactive border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-500 overflow-hidden"
                >
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 rounded-r-full transition-all duration-700 group-hover:h-full group-hover:w-2 ${tx.type === 'income' ? 'bg-secondary shadow-glow-secondary' : 'bg-primary shadow-glow-primary'}`}></div>

                  <div className="flex items-center gap-4 md:gap-6 min-w-0 relative z-10">
                    <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-white/5 border border-white/5 group-hover:border-primary/20 group-hover:bg-primary/5 transition-all duration-700">
                      <IndianRupee className={`h-6 w-6 transition-all duration-700 ${tx.type === 'income' ? 'text-secondary group-hover:rotate-[15deg]' : 'text-on-surface-variant opacity-40 group-hover:text-primary group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-[-12deg]'}`} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-base md:text-lg font-semibold md:font-bold text-on-surface truncate tracking-tight group-hover:text-white transition-colors duration-500">
                        {tx.description || tx.category}
                      </span>
                      <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs font-bold md:font-black uppercase tracking-widest transition-opacity duration-500">
                        <span className={tx.type === 'income' ? 'text-secondary/80' : 'text-primary/70'}>{tx.category}</span>
                        <span className="text-white/10 text-[8px]">•</span>
                        <span className="text-white/30">{format(tx.timestamp, "MMM dd, yyyy")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 relative z-10">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={`text-lg md:text-2xl font-bold md:font-black tracking-tighter font-display whitespace-nowrap text-right drop-shadow-2xl transition-all duration-700 group-hover:scale-105 ${tx.type === 'income' ? 'text-secondary' : 'text-on-surface'}`}>
                        <span className={`opacity-20 font-semibold md:font-bold mr-1 text-sm md:text-lg translate-y-[-2px] inline-block`}>{tx.type === 'income' ? '+' : '-'}</span>
                        {formatINR(tx.amount).replace('₹', '')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-500 sm:translate-x-4 sm:group-hover:translate-x-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(tx); }}
                        className="p-2 rounded-xl bg-white/[0.03] text-on-surface-variant hover:text-white hover:bg-white/10 transition-all border border-white/5 active:scale-90"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(tx); }}
                        className="p-2 rounded-xl bg-white/[0.03] text-on-surface-variant hover:text-white hover:bg-rose-500/20 hover:border-rose-500/40 transition-all border border-white/5 active:scale-90"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {(hasMore || filteredTransactions.length > displayLimit) && (
        <div className="flex justify-center pt-8 pb-4">
          <button
            onClick={handleShowMore}
            disabled={loading}
            className="group relative px-10 py-4 bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-xl border border-white/10 rounded-2xl transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 overflow-hidden disabled:opacity-50 disabled:hover:scale-100"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <div className="relative z-10 flex items-center gap-3">
              {loading && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40 group-hover:text-primary transition-colors duration-500">
                {loading ? "Scanning records..." : "Show More Records"}
              </span>
            </div>
          </button>
        </div>
        )}
      </div>
    </div>
  );
}
