"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/firebase/auth";
import { usePortfolio } from "@/lib/PortfolioContext";
import { 
  savePortfolioSnapshot,
  updatePortfolioSnapshot,
  PortfolioItem, 
  PortfolioCategoryGroup,
} from "@/lib/firebase/firestore";
import { formatINR } from "@/lib/utils";
import { Wallet, ShieldCheck, Camera, TrendingUp, RefreshCw, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { motion } from "framer-motion";
import PageHeader from "@/components/layout/PageHeader";
import PortfolioCategoryCard from "@/components/portfolio/PortfolioCategoryCard";
import AddPortfolioItemModal from "@/components/portfolio/AddPortfolioItemModal";
import UpdateSnapshotConfirmationModal from "@/components/portfolio/UpdateSnapshotConfirmationModal";
import PageLoading from "@/components/layout/PageLoading";

import { useModal } from "@/lib/ModalContext";

function PortfolioContent() {
  const { user, encryptionKey } = useAuth();
  const { 
    portfolioItems: items,
    portfolioLoading: loading,
    loadPortfolioData,
    netWorth,
    liquid,
    investments,
    receivables,
    liabilities,
    canTakeSnapshot,
    daysUntilNextSnapshot,
    latestSnapshot,
  } = usePortfolio();

  const {
    isAddPortfolioOpen,
    editingPortfolioItem,
    openAddPortfolio,
    closeAddPortfolio,
  } = useModal();

  const [isUpdateConfirmOpen, setIsUpdateConfirmOpen] = useState(false);

  useEffect(() => {
    loadPortfolioData();
  }, [loadPortfolioData]);

  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [updatingSnapshot, setUpdatingSnapshot] = useState(false);

  const currentMonthYear = format(new Date(), "yyyy-MM");

  const groupItems = (group: PortfolioCategoryGroup) => items.filter(i => i.categoryGroup === group);

  const handleSaveSnapshot = async () => {
    if (!user) {
      toast.error("You must be logged in to save snapshots");
      return;
    }
    
    setSavingSnapshot(true);
    try {
      if (!encryptionKey) {
        throw new Error("Encryption key missing. Please ensure your PIN is entered correctly.");
      }

      const snapshotItems = {
        LIQUID: groupItems("LIQUID").map(i => ({ name: i.name, amount: i.amount })),
        INVESTMENTS: groupItems("INVESTMENTS").map(i => ({ name: i.name, amount: i.amount })),
        RECEIVABLES: groupItems("RECEIVABLES").map(i => ({ name: i.name, amount: i.amount })),
        LIABILITIES: groupItems("LIABILITIES").map(i => ({ name: i.name, amount: i.amount })),
      };

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
    } catch (err: any) {
      toast.error("Failed to save snapshot: " + (err.message || "Unknown error"));
      console.error("Snapshot save error:", err);
    } finally {
      setSavingSnapshot(false);
    }
  };

  const handleUpdateLatestSnapshot = async () => {
    if (!user || !encryptionKey || !latestSnapshot?.id) {
      toast.error("Cannot update snapshot — missing credentials or no existing snapshot.");
      return;
    }
    setUpdatingSnapshot(true);
    try {
      const snapshotItems = {
        LIQUID: groupItems("LIQUID").map(i => ({ name: i.name, amount: i.amount })),
        INVESTMENTS: groupItems("INVESTMENTS").map(i => ({ name: i.name, amount: i.amount })),
        RECEIVABLES: groupItems("RECEIVABLES").map(i => ({ name: i.name, amount: i.amount })),
        LIABILITIES: groupItems("LIABILITIES").map(i => ({ name: i.name, amount: i.amount })),
      };
      await updatePortfolioSnapshot(
        latestSnapshot.id,
        {
          totalNetWorth: netWorth,
          liquid,
          investments,
          receivables,
          liabilities,
          items: snapshotItems,
          timestamp: new Date(),
        },
        encryptionKey
      );
      toast.success("Latest snapshot updated with current values");
      setIsUpdateConfirmOpen(false);
    } catch (err: any) {
      toast.error("Failed to update snapshot: " + (err.message || "Unknown error"));
      console.error("Snapshot update error:", err);
    } finally {
      setUpdatingSnapshot(false);
    }
  };

  const handleEdit = (item: PortfolioItem) => {
    openAddPortfolio(item.categoryGroup, item);
  };

  const handleAdd = (group?: PortfolioCategoryGroup) => {
    openAddPortfolio(group, null);
  };

  if (loading) {
    return <PageLoading loading={true} error={null} message="Loading portfolio..." />;
  }

  return (
    <>
      <div className="flex flex-col space-y-2 md:space-y-10 w-full max-w-[1600px] mx-auto selection:bg-primary/30 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-24">
        
        <PageHeader 
          category="Portfolio"
          title="Asset Portfolio"
          subtitle={<>Broad view of <span className="text-white font-bold">accumulated wealth.</span></>}
          actions={
            <div className="flex flex-col gap-2 shrink-0 pt-1">
              <div className="glass-card px-4 py-2.5 md:px-8 md:py-5 flex items-center gap-4 md:gap-10 border-white/10 bg-white/[0.02] shadow-2xl relative group/net overflow-hidden rounded-2xl md:rounded-[2rem]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover/net:opacity-100 transition-opacity duration-1000" />
                
                <div className="flex flex-col">
                  <span className="text-[8px] md:text-[10px] font-black text-primary/60 uppercase tracking-[0.4em] mb-0.5 md:mb-2">Net Worth</span>
                  <span className="text-xl md:text-4xl font-black font-display text-white tracking-tighter tabular-nums drop-shadow-2xl">
                    {formatINR(netWorth)}
                  </span>
                </div>
                
                <div className="h-8 md:h-12 w-[1px] bg-white/10" />
                
                <div className="flex flex-col">
                  <span className="text-[8px] md:text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-0.5 md:mb-2">Status</span>
                  <span className="text-[8px] md:text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center gap-2 group-hover/status:text-primary transition-colors">
                    <ShieldCheck className="h-3 md:h-4 w-3 md:w-4 text-primary shadow-glow-primary" /> SECURE
                  </span>
                </div>
              </div>

              <Link
                href="/analytics?tab=growth"
                className="flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.07] hover:border-white/10 transition-all active:scale-[0.98] group shadow-xl"
              >
                <TrendingUp className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] group-hover:text-white transition-colors">
                  View Growth Analytics
                </span>
              </Link>

              {canTakeSnapshot && items.length > 0 && (
                <button 
                  onClick={handleSaveSnapshot}
                  disabled={savingSnapshot}
                  className="flex items-center justify-center gap-2 px-6 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-[0.2em] hover:bg-primary/20 transition-all disabled:opacity-50 mt-1"
                >
                  <Camera className="h-3 w-3" />
                  {savingSnapshot ? "Saving..." : "Log Snapshot"}
                </button>
              )}
              {!canTakeSnapshot && latestSnapshot && items.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-1">
                  <button
                    onClick={() => setIsUpdateConfirmOpen(true)}
                    disabled={updatingSnapshot}
                    className="flex items-center justify-center gap-2 px-6 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-blue-500/20 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${updatingSnapshot ? 'animate-spin' : ''}`} />
                    {updatingSnapshot ? "Updating..." : "Update Latest"}
                  </button>
                  <div className="flex items-center justify-center gap-1.5 opacity-60">
                    <Clock className="h-2.5 w-2.5 text-white/30" />
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">
                      New snapshot in {daysUntilNextSnapshot}d
                    </span>
                  </div>
                </div>
              )}
            </div>
          }
        />

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 flex-1 content-start md:pb-32"
        >
          {([
            { group: "LIQUID", items: groupItems("LIQUID") },
            { group: "INVESTMENTS", items: groupItems("INVESTMENTS") },
            { group: "RECEIVABLES", items: groupItems("RECEIVABLES") },
            { group: "LIABILITIES", items: groupItems("LIABILITIES") },
          ] as const).map((block) => (
            <motion.div
              key={block.group}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <PortfolioCategoryCard 
                group={block.group} 
                items={block.items} 
                totalAssets={liquid + investments + receivables}
                onEdit={handleEdit} 
                onAdd={() => handleAdd(block.group)} 
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      <AddPortfolioItemModal 
        isOpen={isAddPortfolioOpen} 
        onClose={closeAddPortfolio} 
        initialData={editingPortfolioItem} 
      />
      <UpdateSnapshotConfirmationModal
        isOpen={isUpdateConfirmOpen}
        onClose={() => setIsUpdateConfirmOpen(false)}
        onConfirm={handleUpdateLatestSnapshot}
        loading={updatingSnapshot}
        latestSnapshot={latestSnapshot}
        currentValues={{
          netWorth,
          liquid,
          investments,
          receivables,
          liabilities
        }}
      />
    </>
  );
}

export default function PortfolioClient() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <PageLoading loading={true} error={null} message="Loading portfolio..." />;
  }

  return <PortfolioContent />;
}
