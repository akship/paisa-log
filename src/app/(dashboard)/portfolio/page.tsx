"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/firebase/auth";
import { useData } from "@/lib/DataContext";
import { 
  savePortfolioSnapshot,
  PortfolioItem, 
  PortfolioCategoryGroup,
  PortfolioSnapshot
} from "@/lib/firebase/firestore";
import { formatINR } from "@/lib/utils";
import { Plus, Wallet, ShieldCheck, Info, Camera, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import PageHeader from "@/components/layout/PageHeader";
import PortfolioCategoryCard from "@/components/portfolio/PortfolioCategoryCard";
import AddPortfolioItemModal from "@/components/portfolio/AddPortfolioItemModal";

export default function PortfolioPage() {
  const { user, encryptionKey } = useAuth();
  const { 
    portfolioItems: items, 
    portfolioHistory: history, 
    portfolioLoading: loading,
    loadPortfolioData 
  } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadPortfolioData();
  }, [loadPortfolioData]);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [savingSnapshot, setSavingSnapshot] = useState(false);

  const currentMonthYear = format(new Date(), "yyyy-MM");
  const hasSnapshotThisMonth = history.some(s => s.monthYear === currentMonthYear);

  // Handle Global FAB Action
  useEffect(() => {
    const handleOpenModal = () => setIsModalOpen(true);
    window.addEventListener('paisa-open-add-portfolio', handleOpenModal);
    return () => window.removeEventListener('paisa-open-add-portfolio', handleOpenModal);
  }, []);

  const groupItems = (group: PortfolioCategoryGroup) => items.filter(i => i.categoryGroup === group);

  const calculateTotal = (group: PortfolioCategoryGroup) => 
    groupItems(group).reduce((sum, i) => sum + i.amount, 0);

  const liquid = calculateTotal("LIQUID");
  const investments = calculateTotal("INVESTMENTS");
  const receivables = calculateTotal("RECEIVABLES");
  const liabilities = calculateTotal("LIABILITIES");

  const netWorth = (liquid + investments + receivables) - liabilities;

  // MoM Growth Logic
  const previousSnapshot = history.length > 0 ? (history[0].monthYear === currentMonthYear ? history[1] : history[0]) : null;
  const momChange = previousSnapshot ? netWorth - previousSnapshot.totalNetWorth : 0;
  const momPercent = previousSnapshot && previousSnapshot.totalNetWorth !== 0 
    ? (momChange / previousSnapshot.totalNetWorth) * 100 
    : 0;

  const handleSaveSnapshot = async () => {
    if (!user) return;
    setSavingSnapshot(true);
    const snapshotItems = {
      LIQUID: groupItems("LIQUID").map(i => ({ name: i.name, amount: i.amount })),
      INVESTMENTS: groupItems("INVESTMENTS").map(i => ({ name: i.name, amount: i.amount })),
      RECEIVABLES: groupItems("RECEIVABLES").map(i => ({ name: i.name, amount: i.amount })),
      LIABILITIES: groupItems("LIABILITIES").map(i => ({ name: i.name, amount: i.amount })),
    };

    try {
      await savePortfolioSnapshot({
        user_id: user.uid,
        monthYear: currentMonthYear,
        totalNetWorth: netWorth,
        liquid,
        investments,
        receivables,
        liabilities,
        items: snapshotItems
      }, encryptionKey);
      toast.success("Portfolio snapshot saved for " + format(new Date(), "MMMM yyyy"));
    } catch (err) {
      toast.error("Failed to save snapshot");
      console.error(err);
    } finally {
      setSavingSnapshot(false);
    }
  };

  const handleEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleAdd = (group?: PortfolioCategoryGroup) => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary shadow-glow-primary"></div>
          <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.4em] animate-pulse opacity-60">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col space-y-10 max-w-7xl mx-auto selection:bg-primary/30">
        
        <PageHeader 
          category="Portfolio"
          title="Asset Portfolio"
          subtitle={<>Broad view of <span className="text-white/60">your accumulated wealth.</span></>}
          actions={
            <div className="flex flex-col gap-4">
              <div className="glass-card px-6 md:px-8 py-4 md:py-5 flex items-center justify-between md:justify-start gap-6 md:gap-10 border-primary/20 bg-primary/[0.02] hover:bg-primary/[0.05] transition-all duration-500 overflow-hidden relative group">
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="flex flex-col">
                  <span className="text-[8px] md:text-[10px] font-black text-primary/60 uppercase tracking-[0.4em] mb-1">Net Worth</span>
                  <span className="text-2xl md:text-3xl font-black font-display text-white tracking-tighter tabular-nums drop-shadow-2xl">
                    {formatINR(netWorth)}
                  </span>
                </div>
                
                {previousSnapshot && (
                  <>
                    <div className="h-8 w-px bg-white/10 hidden md:block" />
                    <div className="flex flex-col">
                      <span className="text-[8px] md:text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">MoM Growth</span>
                      <div className={`flex items-center gap-1.5 font-black font-display text-base md:text-lg tracking-tight ${momChange >= 0 ? 'text-primary' : 'text-rose-500'}`}>
                        {momChange >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                        {formatINR(Math.abs(momChange))}
                        <span className="text-[10px] opacity-60 ml-1">({momPercent.toFixed(1)}%)</span>
                      </div>
                    </div>
                  </>
                )}

                <div className="h-8 w-px bg-white/10 hidden md:block" />
                <div className="flex flex-col items-end md:items-start">
                  <span className="text-[8px] md:text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">Status</span>
                  <span className="text-[9px] md:text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3 text-primary/60" /> SECURE
                  </span>
                </div>
              </div>

              {!hasSnapshotThisMonth && items.length > 0 && (
                <div className="glass-card p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-primary/10 bg-white/[0.01] animate-in slide-in-from-right duration-500">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Camera className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Snapshot Due</h4>
                      <p className="text-[8px] font-medium text-white/40">Lock in your current values.</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleSaveSnapshot}
                    disabled={savingSnapshot}
                    className="w-full md:w-auto px-4 py-2 bg-primary text-background text-[9px] font-black uppercase tracking-[0.2em] rounded-lg hover:shadow-glow-primary transition-all disabled:opacity-50"
                  >
                    {savingSnapshot ? "Saving..." : "Log Now"}
                  </button>
                </div>
              )}
            </div>
          }
        />

        {/* 2x2 Portfolio Grid - Optimized for 100vh Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 flex-1 content-start md:pb-32">
          <PortfolioCategoryCard 
            group="LIQUID" 
            items={groupItems("LIQUID")} 
            onEdit={handleEdit} 
            onAdd={() => handleAdd("LIQUID")} 
          />
          <PortfolioCategoryCard 
            group="INVESTMENTS" 
            items={groupItems("INVESTMENTS")} 
            onEdit={handleEdit} 
            onAdd={() => handleAdd("INVESTMENTS")} 
          />
          <PortfolioCategoryCard 
            group="RECEIVABLES" 
            items={groupItems("RECEIVABLES")} 
            onEdit={handleEdit} 
            onAdd={() => handleAdd("RECEIVABLES")} 
          />
          <PortfolioCategoryCard 
            group="LIABILITIES" 
            items={groupItems("LIABILITIES")} 
            onEdit={handleEdit} 
            onAdd={() => handleAdd("LIABILITIES")} 
          />
        </div>
      </div>

      <AddPortfolioItemModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }} 
        initialData={editingItem} 
      />
    </>
  );
}
