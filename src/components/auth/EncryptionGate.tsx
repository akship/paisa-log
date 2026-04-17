"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth";
import { deriveKeyFromPin, CryptoUtils } from "@/lib/cryptography";
import { updateUserPreferences, getAllUserTransactions, getAllUserPortfolioItems, updateTransaction, updatePortfolioItem } from "@/lib/firebase/firestore";
import { VAULT_CANARY } from "@/lib/constants";
import { Lock, ShieldCheck, RefreshCw, AlertCircle, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function EncryptionGate({ children }: { children: React.ReactNode }) {
  const { user, preferences, encryptionKey, setEncryptionKey, loading: authLoading, isVaultLoading } = useAuth();
  const [pin, setPin] = useState("");
  const [isDeriving, setIsDeriving] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [migrationStats, setMigrationStats] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  // If auth or vault sync is still loading, show a neutral loader
  if (authLoading || isVaultLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="bg-primary/20 h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not logged in or already unlocked, just show children
  if (!user || encryptionKey) {
    return <>{children}</>;
  }

  const isSetupMode = !preferences?.encryptionSalt;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) {
      setError("Please enter a 6-digit PIN");
      return;
    }

    setIsDeriving(true);
    setError(null);

    try {
      let salt = preferences?.encryptionSalt;
      let isInitialSetup = false;

      // Initial Setup Case
      if (!salt) {
        salt = crypto.randomUUID();
        await updateUserPreferences(user.uid, { encryptionSalt: salt });
        isInitialSetup = true;
      }

      const key = await deriveKeyFromPin(pin, salt);
      
      // PIN Verification Check
      if (!isInitialSetup && preferences?.pinVerificationToken) {
        try {
          const decrypted = await CryptoUtils.decryptString(preferences.pinVerificationToken, key);
          if (decrypted !== VAULT_CANARY) {
            setError("Incorrect PIN. Please try again.");
            setIsDeriving(false);
            return;
          }
        } catch (err) {
          // Decryption failure (invalid HMAC/tag) means wrong key
          setError("Incorrect PIN. Please try again.");
          setIsDeriving(false);
          return;
        }
      } else {
        // First time setup OR legacy user transition - create the verification token
        const token = await CryptoUtils.encryptString(VAULT_CANARY, key);
        await updateUserPreferences(user.uid, { pinVerificationToken: token });
        if (isInitialSetup) {
          toast.success("Security vault initialized!");
        }
      }
      
      setEncryptionKey(key);

      // Trigger Migration if in setup mode
      if (isSetupMode) {
        await startMigration(key);
      }
    } catch (err) {
      console.error("Vault unlock failed:", err);
      setError("Failed to unlock vault. Check your connection.");
    } finally {
      setIsDeriving(false);
    }
  };

  const startMigration = async (key: CryptoKey) => {
    setIsMigrating(true);
    try {
      const txs = await getAllUserTransactions(user.uid);
      const portfolio = await getAllUserPortfolioItems(user.uid);
      
      const total = txs.length + portfolio.length;
      setMigrationStats({ current: 0, total });

      // Migrate Transactions
      for (const tx of txs) {
        if (!tx.isEncrypted) {
          await updateTransaction(tx.id!, { ...tx }, key);
        }
        setMigrationStats(prev => ({ ...prev, current: prev.current + 1 }));
      }

      // Migrate Portfolio
      for (const item of portfolio) {
        if (!item.isEncrypted) {
          await updatePortfolioItem(item.id!, { ...item }, key);
        }
        setMigrationStats(prev => ({ ...prev, current: prev.current + 1 }));
      }

      toast.success("All existing data has been secured!");
    } catch (err) {
      console.error("Migration failed:", err);
      toast.error("Some data failed to migrate. It will stay unencrypted.");
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#060912]/85 backdrop-blur-xl animate-in fade-in duration-700">
      <div className="glass-card max-w-md w-full p-8 md:p-12 border-primary/20 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="p-4 bg-primary/10 rounded-3xl border border-primary/20 shadow-glow-primary">
            {isSetupMode ? <ShieldCheck className="h-10 w-10 text-primary" /> : <Lock className="h-10 w-10 text-primary" />}
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black font-display tracking-tight text-on-surface">
              {isSetupMode ? "Enable Security" : "Unlock Vault"}
            </h1>
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-[280px]">
              {isSetupMode 
                ? "Set a 6-digit PIN to encrypt your financial activity. Your PIN never leaves this device." 
                : "Enter your secure PIN to access your encrypted financial data."}
            </p>
          </div>

          {!isMigrating ? (
            <form onSubmit={handleUnlock} className="w-full space-y-6">
              <div className="space-y-4">
                <input
                  type="password"
                  maxLength={6}
                  pattern="\d*"
                  inputMode="numeric"
                  placeholder="• • • • • •"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center text-4xl tracking-widest font-black bg-slate-900/40 border-2 border-white/5 rounded-2xl py-4 focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/5"
                  autoFocus
                />
                {error && (
                  <div className="flex items-center gap-2 text-tertiary text-xs font-bold justify-center">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </div>

              {isSetupMode && (
                <div className="flex items-start gap-4 p-4 bg-tertiary/10 rounded-2xl border border-tertiary/20 text-left cursor-pointer group hover:bg-tertiary/20 transition-all" onClick={() => setHasConsented(!hasConsented)}>
                  <div className={`mt-0.5 min-w-[20px] h-5 rounded-md border-2 transition-all flex items-center justify-center ${hasConsented ? 'bg-tertiary border-tertiary shadow-glow-tertiary' : 'border-on-surface-variant/30 group-hover:border-tertiary/50'}`}>
                    {hasConsented && <Check className="h-3.5 w-3.5 text-surface font-black" />}
                  </div>
                  <p className="text-[11px] font-bold text-on-surface-variant leading-tight">
                    I understand that my data is encrypted locally using this PIN. If I forget it, my financial data <span className="text-tertiary">cannot be recovered</span>.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isDeriving || pin.length !== 6 || (isSetupMode && !hasConsented)}
                className="w-full bg-primary text-on-primary py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3 overflow-hidden group"
              >
                {isDeriving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Deriving Key...
                  </>
                ) : (
                  <>
                    {isSetupMode ? "Setup Vault" : "Unlock Now"}
                    <Lock className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              
              {isSetupMode && (
                <p className="text-[10px] text-tertiary font-black uppercase tracking-widest opacity-60">
                  Critical: If you lose this PIN, you lose your data.
                </p>
              )}
            </form>
          ) : (
            <div className="w-full space-y-6 py-4">
              <div className="flex flex-col items-center gap-4">
                <RefreshCw className="h-10 w-10 text-secondary animate-spin" />
                <div className="space-y-1">
                  <p className="font-bold text-sm tracking-tight text-on-surface">Migrating Data...</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">
                    Securing {migrationStats.current} of {migrationStats.total} items
                  </p>
                </div>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-secondary shadow-glow-secondary transition-all duration-300" 
                  style={{ width: `${(migrationStats.current / migrationStats.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
