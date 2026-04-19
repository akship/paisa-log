"use client";

import { useState, useMemo } from "react";
import { PortfolioSnapshot, deletePortfolioSnapshot } from "@/lib/firebase/firestore";
import { formatINR } from "@/lib/utils";
import { Edit2, Trash2, Calendar, History, ShieldAlert, ChevronDown, List } from "lucide-react";
import { toast } from "react-hot-toast";
import EditSnapshotModal from "./EditSnapshotModal";
import { usePortfolio } from "@/lib/PortfolioContext";
import { Loader2 } from "lucide-react";

interface Props {
  history: PortfolioSnapshot[];
  encryptionKey: CryptoKey | null;
}

export default function SnapshotManager({ history, encryptionKey }: Props) {
  const { historyLimit, loadFullHistory, portfolioLoading } = usePortfolio();
  const [editingSnapshot, setEditingSnapshot] = useState<PortfolioSnapshot | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => b.monthYear.localeCompare(a.monthYear)),
    [history]
  );

  const handleDelete = async (id: string, month: string) => {
    if (window.confirm(`Are you sure you want to permanently delete the snapshot for ${month}? This cannot be undone.`)) {
      try {
        await deletePortfolioSnapshot(id);
        toast.success(`Snapshot for ${month} deleted`);
      } catch (err) {
        toast.error("Failed to delete snapshot");
        console.error(err);
      }
    }
  };

  const handleShowMore = () => {
    setIsExpanding(true);
    loadFullHistory();
    // Reset expanding state after a short delay to allow subscription to kick in
    setTimeout(() => setIsExpanding(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 mb-8 mt-12">
        <h2 className="text-[10px] font-black text-white/10 uppercase tracking-[0.6em] whitespace-nowrap">Archives & Log Management</h2>
        <div className="h-px w-full bg-white/5" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedHistory.map((s) => {
          const isLocked = s.totalNetWorth === -1;
          
          return (
            <div 
              key={s.id} 
              className={`group glass-card rounded-3xl border border-white/5 flex flex-col transition-all duration-700 hover:border-white/10 ${isLocked ? 'bg-rose-500/[0.02]' : 'bg-white/[0.01]'}`}
            >
              <div className="p-6 md:p-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                   <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border transition-transform duration-500 group-hover:rotate-6 ${isLocked ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                      {isLocked ? <ShieldAlert className="h-6 w-6" /> : <History className="h-6 w-6" />}
                   </div>
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-3 w-3 text-white/20" />
                        <span className="text-xs font-black text-white tracking-widest uppercase">{s.monthYear}</span>
                      </div>
                      {isLocked ? (
                        <p className="text-[10px] font-bold text-rose-500/60 uppercase tracking-widest">Encryption Key Mismatch</p>
                      ) : (
                        <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest">Logged: {formatINR(s.totalNetWorth)}</p>
                      )}
                   </div>
                </div>
  
                {!isLocked && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 px-4 py-3 bg-white/[0.02] rounded-2xl border border-white/5">
                     <div className="flex flex-col">
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Liquid</span>
                        <span className="text-xs font-bold text-white/70">{formatINR(s.liquid)}</span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Invest</span>
                        <span className="text-xs font-bold text-white/70">{formatINR(s.investments)}</span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Receive</span>
                        <span className="text-xs font-bold text-white/70">{formatINR(s.receivables)}</span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[8px] font-black text-rose-500/40 uppercase tracking-widest">Owe</span>
                        <span className="text-xs font-bold text-rose-500/60">{formatINR(s.liabilities)}</span>
                     </div>
                  </div>
                )}
  
                <div className="flex items-center gap-3">
                  {!isLocked && s.items && (
                    <button
                      onClick={() => s.id && setExpandedId(expandedId === s.id ? null : s.id)}
                      className={`p-3 rounded-2xl border transition-all ${expandedId === s.id ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-white/5 border-transparent text-white/40 hover:text-white'}`}
                      title="Show Breakdown"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform duration-500 ${expandedId === s.id ? "rotate-180" : ""}`} />
                    </button>
                  )}
                  <button
                    onClick={() => !isLocked && setEditingSnapshot(s)}
                    disabled={isLocked}
                    className={`p-3 rounded-2xl bg-white/5 transition-all ${isLocked ? 'opacity-20 cursor-not-allowed' : 'text-white/40 hover:text-white hover:bg-blue-500/20 hover:border-blue-500/30 border border-transparent'}`}
                    title={isLocked ? "Cannot edit locked data" : "Adjust Weights"}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => s.id && handleDelete(s.id, s.monthYear)}
                    className="p-3 rounded-2xl bg-white/5 text-white/40 hover:text-rose-500 hover:bg-rose-500/20 hover:border-rose-500/30 border border-transparent transition-all"
                    title="Expunge Snapshot"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {expandedId === s.id && s.items && (
                <div className="px-6 pb-8 md:px-8 border-t border-white/5 bg-white/[0.01] animate-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
                    {Object.entries(s.items).map(([group, items]) => (
                      <div key={group}>
                        <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                          <div className={`h-1 w-1 rounded-full ${group === 'LIABILITIES' ? 'bg-rose-500' : 'bg-primary'}`} />
                          {group}
                        </h4>
                        <div className="space-y-3">
                          {items.length > 0 ? items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center group/item">
                              <span className="text-xs font-bold text-white/60 group-hover/item:text-white transition-colors">{item.name}</span>
                              <span className="text-xs font-black text-white/40 tabular-nums">{formatINR(item.amount)}</span>
                            </div>
                          )) : (
                            <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest italic tracking-tight">No records</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {historyLimit !== undefined && (
        <div className="flex justify-center mt-12 pb-12">
          <button
            onClick={handleShowMore}
            disabled={isExpanding || portfolioLoading}
            className="group relative px-8 py-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-500 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <div className="flex items-center gap-3">
              {isExpanding ? (
                <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
              ) : (
                <History className="h-4 w-4 text-blue-400 group-hover:rotate-12 transition-transform duration-500" />
              )}
              <span className="text-[10px] font-black text-white/40 group-hover:text-white/70 uppercase tracking-[0.4em] transition-colors leading-none">
                {isExpanding ? "Syncing Archives..." : "Access Historical Logs"}
              </span>
            </div>
          </button>
        </div>
      )}

      <EditSnapshotModal 
        isOpen={!!editingSnapshot}
        onClose={() => setEditingSnapshot(null)}
        snapshot={editingSnapshot}
        encryptionKey={encryptionKey}
      />
    </div>
  );
}
