"use client";

import { useState } from "react";
import { useAuth } from "@/lib/firebase/auth";
import { deriveKeyFromPin, CryptoUtils, exportVaultKey } from "@/lib/cryptography";
import { 
  updateUserPreferences, 
  getAllUserTransactions, 
  getAllUserPortfolioItems, 
  getAllUserPortfolioHistory,
  updateTransaction, 
  updatePortfolioItem,
  savePortfolioSnapshot
} from "@/lib/firebase/firestore";
import { VAULT_CANARY } from "@/lib/constants";
import { Lock, RefreshCw, AlertCircle, ShieldCheck, X, Check } from "lucide-react";
import toast from "react-hot-toast";

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePinModal({ isOpen, onClose }: ChangePinModalProps) {
  const { user, preferences, setEncryptionKey, encryptionKey } = useAuth();
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"verify" | "new" | "migrating">("verify");
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [migrationStats, setMigrationStats] = useState({ current: 0, total: 0 });
  const [failedItems, setFailedItems] = useState<{id: string, type: string}[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferences?.encryptionSalt) return;
    
    setIsProcessing(true);
    setError(null);
    try {
      const key = await deriveKeyFromPin(oldPin, preferences.encryptionSalt);
      
      // Verification check
      if (preferences.pinVerificationToken) {
        try {
          const decrypted = await CryptoUtils.decryptString(preferences.pinVerificationToken, key);
          if (decrypted !== VAULT_CANARY) {
            setError("Incorrect current PIN");
            setIsProcessing(false);
            return;
          }
        } catch (err) {
          setError("Incorrect current PIN");
          setIsProcessing(false);
          return;
        }
      } else {
        // Fallback for legacy users without a token: compare raw key bytes
        if (!encryptionKey) throw new Error("Vault is locked");
        
        const newJwk = await exportVaultKey(key);
        const oldJwk = await exportVaultKey(encryptionKey);
        
        if (newJwk.k !== oldJwk.k) {
          setError("Incorrect current PIN");
          setIsProcessing(false);
          return;
        }
      }

      setStep("new");
    } catch (err) {
      console.error("Verification failed:", err);
      setError("Verification failed. Check your connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartMigration = async (e: React.FormEvent, force = false) => {
    if (e) e.preventDefault();
    
    if (!force) {
      if (newPin.length !== 6) {
        setError("PIN must be 6 digits");
        return;
      }
      if (newPin !== confirmPin) {
        setError("PINs do not match");
        return;
      }
    }

    setIsProcessing(true);
    setError(null);
    
    try {
      if (!user || !preferences?.encryptionSalt) throw new Error("Missing user context");

      // 1. Fetch ALL data while we still have the old key (Parallelized for speed)
      const [txs, portfolio, history] = await Promise.all([
        getAllUserTransactions(user.uid, encryptionKey),
        getAllUserPortfolioItems(user.uid, encryptionKey),
        getAllUserPortfolioHistory(user.uid, encryptionKey)
      ]);
      
      // 2. Check for decryption failures
      const failures: {id: string, type: string}[] = [];
      txs.forEach(t => t.decryptionFailed && failures.push({id: t.id || '?', type: 'Transaction'}));
      portfolio.forEach(p => p.decryptionFailed && failures.push({id: p.id || '?', type: 'Portfolio'}));
      history.forEach(h => h.decryptionFailed && failures.push({id: h.id || '?', type: 'Snapshot'}));

      if (failures.length > 0 && !force) {
        setFailedItems(failures);
        setStep("new"); 
        setError(`Security Mismatch: ${failures.length} items could not be decrypted.`);
        setIsProcessing(false);
        return;
      }

      setStep("migrating");
      const total = txs.length + portfolio.length + history.length;
      setMigrationStats({ current: 0, total });

      // 3. Prepare NEW salt and key
      const newSalt = crypto.randomUUID();
      const newKey = await deriveKeyFromPin(newPin, newSalt);

      // 4. Re-encrypt Transactions
      for (const tx of txs) {
        if (tx.decryptionFailed) {
          // Skip problematic records during migration
          setMigrationStats(prev => ({ ...prev, current: prev.current + 1 }));
          continue;
        }
        await updateTransaction(tx.id!, { ...tx }, newKey);
        setMigrationStats(prev => ({ ...prev, current: prev.current + 1 }));
      }

      // 5. Re-encrypt Portfolio
      for (const item of portfolio) {
        if (item.decryptionFailed) {
          setMigrationStats(prev => ({ ...prev, current: prev.current + 1 }));
          continue;
        }
        await updatePortfolioItem(item.id!, { ...item }, newKey);
        setMigrationStats(prev => ({ ...prev, current: prev.current + 1 }));
      }

      // 6. Re-encrypt History
      for (const snapshot of history) {
        if (snapshot.decryptionFailed) {
          setMigrationStats(prev => ({ ...prev, current: prev.current + 1 }));
          continue;
        }
        // Strip id and timestamp as expected by savePortfolioSnapshot
        const { id, timestamp, ...snapshotData } = snapshot;
        await savePortfolioSnapshot(snapshotData, newKey);
        setMigrationStats(prev => ({ ...prev, current: prev.current + 1 }));
      }

      // 7. Update salt and verification token in user profile
      const pinVerificationToken = await CryptoUtils.encryptString(VAULT_CANARY, newKey);
      await updateUserPreferences(user.uid, { 
        encryptionSalt: newSalt,
        pinVerificationToken 
      });
      
      // 8. Update local state
      setEncryptionKey(newKey);
      
      toast.success("PIN changed successfully!");
      onClose();
    } catch (err) {
      console.error("PIN change failed:", err);
      setError("Critical error during migration. Please do not close the tab.");
      toast.error("Migration failed!");
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#060912]/85 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="glass-card max-w-md w-full p-8 md:p-10 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl hover:bg-white/5 transition-colors"
          disabled={step === "migrating"}
        >
          <X className="h-5 w-5 opacity-40 hover:opacity-100" />
        </button>

        <div className="flex flex-col items-center text-center space-y-6">
          <div className="p-4 bg-primary/10 rounded-3xl border border-primary/20 shadow-glow-primary">
            {step === "migrating" ? (
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            ) : (
              <ShieldCheck className="h-8 w-8 text-primary" />
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black font-display tracking-tight text-on-surface">
              {step === "verify" ? "Security Check" : step === "new" ? "New Security PIN" : "Changing Vault Key"}
            </h2>
            <p className="text-on-surface-variant text-xs font-medium opacity-60 max-w-[280px] mx-auto leading-relaxed">
              {step === "verify" ? "Enter your current 6-digit PIN to authorize the security update." :
               step === "new" ? "Choose a new 6-digit PIN. Make sure you remember it!" :
               "Re-encrypting all transactions and assets with your new master key."}
            </p>
          </div>

          {step === "verify" && (
            <form onSubmit={handleVerify} className="w-full space-y-6">
              <div className="space-y-4">
                <input
                  type="password"
                  maxLength={6}
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Current PIN"
                  className="w-full text-center text-3xl font-black bg-white/5 border border-white/10 rounded-2xl py-4 focus:outline-none focus:border-primary/50 transition-all"
                  autoFocus
                />
                {error && (
                  <div className="flex items-center gap-2 text-tertiary text-xs font-bold justify-center">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={isProcessing || oldPin.length !== 6}
                className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              >
                {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Verify Identity"}
              </button>
            </form>
          )}

          {step === "new" && (
            <form onSubmit={handleStartMigration} className="w-full space-y-4">
              {failedItems.length > 0 ? (
                <div className="space-y-4 animate-in slide-in-from-top duration-500">
                  <div className="p-4 bg-tertiary/10 rounded-2xl border border-tertiary/20 text-left space-y-3">
                    <div className="flex items-center gap-2 text-tertiary text-xs font-black uppercase tracking-widest">
                      <AlertCircle className="h-4 w-4" />
                      Key Mismatch Detected
                    </div>
                    <p className="text-[11px] font-bold text-on-surface-variant leading-relaxed">
                      {failedItems.length} records were encrypted with a different PIN and cannot be decrypted.
                      Proceeding will skip these items, and their current values will be lost.
                    </p>
                    <div className="max-h-24 overflow-y-auto pr-2 custom-scrollbar space-y-1">
                      {failedItems.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-[9px] font-mono opacity-60 bg-white/5 p-1 px-2 rounded">
                          <span>{item.type}</span>
                          <span className="truncate max-w-[120px]">{item.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleStartMigration(e, true)}
                      disabled={isProcessing}
                      className="w-full bg-tertiary/20 text-tertiary border border-tertiary/30 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all hover:bg-tertiary/30"
                    >
                      {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin mx-auto" /> : "Ignore & Proceed (Data Loss)"}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-2 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                    >
                      Cancel & Safety Stop
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    type="password"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="New 6-Digit PIN"
                    className="w-full text-center text-3xl font-black bg-white/5 border border-white/10 rounded-2xl py-4 focus:outline-none focus:border-primary/50 transition-all placeholder:opacity-20"
                    autoFocus
                  />
                  <input
                    type="password"
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="Confirm New PIN"
                    className="w-full text-center text-3xl font-black bg-white/5 border border-white/10 rounded-2xl py-4 focus:outline-none focus:border-primary/50 transition-all placeholder:opacity-20"
                  />
                  {error && (
                    <div className="flex items-center gap-2 text-tertiary text-[10px] font-black uppercase tracking-widest justify-center">
                      <AlertCircle className="h-3.5 w-3.5 text-tertiary" /> {error}
                    </div>
                  )}

                  <div 
                    className="flex items-start gap-4 p-4 bg-tertiary/10 rounded-2xl border border-tertiary/20 text-left cursor-pointer group hover:bg-tertiary/20 transition-all" 
                    onClick={() => setHasConsented(!hasConsented)}
                  >
                    <div className={`mt-0.5 min-w-[20px] h-5 rounded-md border-2 transition-all flex items-center justify-center ${hasConsented ? 'bg-tertiary border-tertiary shadow-glow-tertiary' : 'border-on-surface-variant/30 group-hover:border-tertiary/50'}`}>
                      {hasConsented && <Check className="h-3.5 w-3.5 text-surface font-black" />}
                    </div>
                    <p className="text-[11px] font-bold text-on-surface-variant leading-tight">
                      I understand that if I forget this new PIN, my encrypted data <span className="text-tertiary uppercase">cannot be recovered</span>.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing || newPin.length !== 6 || confirmPin !== newPin || !hasConsented}
                    className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Change PIN & Re-encrypt"}
                  </button>
                </>
              )}
            </form>
          )}


          {step === "migrating" && (
            <div className="w-full space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">
                  <span>Progress</span>
                  <span>{Math.round((migrationStats.current / migrationStats.total) * 100)}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary shadow-glow-primary transition-all duration-300"
                    style={{ width: `${(migrationStats.current / migrationStats.total) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest opacity-40">
                  Updated {migrationStats.current} of {migrationStats.total} records
                </p>
              </div>
              <p className="text-[10px] text-tertiary font-black uppercase tracking-widest animate-pulse">
                Do not close your browser
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
