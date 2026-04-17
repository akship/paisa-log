"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth";
import { updateUserPreferences } from "@/lib/firebase/firestore";
import { BASE_EXPENSE_CATEGORIES, BASE_INCOME_CATEGORIES, EXPENSE_REMAP, INCOME_REMAP } from "@/lib/constants";
import { Save, User, CheckCircle2, Hash, ArrowDownRight, ArrowUpRight, Plus, X, ShieldCheck, Key, Lock, AlertCircle } from "lucide-react";
import ChangePinModal from "@/components/auth/ChangePinModal";

import PageHeader from "@/components/layout/PageHeader";
import SectionHeader from "@/components/layout/SectionHeader";


function remapCategories(list: string[], remap: Record<string, string>, validSet: Set<string>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const cat of list) {
    const mapped = remap[cat] ?? (validSet.has(cat) ? cat : null);
    if (mapped && !seen.has(mapped)) {
      seen.add(mapped);
      result.push(mapped);
    }
  }
  // Ensure all base categories are present (in order)
  for (const cat of validSet) {
    if (!seen.has(cat)) result.push(cat);
  }
  return result;
}

const VALID_EXPENSES = new Set(BASE_EXPENSE_CATEGORIES);
const VALID_INCOME   = new Set(BASE_INCOME_CATEGORIES);

export default function SettingsPage() {
  const { user, preferences, refreshPreferences } = useAuth();
  const [profileName, setProfileName] = useState("");
  const [enabledExpenses, setEnabledExpenses] = useState<string[]>([]);
  const [enabledIncome, setEnabledIncome] = useState<string[]>([]);
  const [newExpenseInput, setNewExpenseInput] = useState("");
  const [newIncomeInput, setNewIncomeInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [activeTab, setActiveTab] = useState<"profile" | "categories" | "security">("profile");
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  useEffect(() => {
    if (preferences) {
      setProfileName(preferences.customDisplayName || user?.displayName || "");
      const rawExpenses = preferences.enabledExpenseCategories || BASE_EXPENSE_CATEGORIES;
      const rawIncome   = preferences.enabledIncomeCategories  || BASE_INCOME_CATEGORIES;
      setEnabledExpenses(remapCategories(rawExpenses, EXPENSE_REMAP, VALID_EXPENSES));
      setEnabledIncome(remapCategories(rawIncome, INCOME_REMAP, VALID_INCOME));
    }
  }, [preferences, user]);


  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSuccess(false);

    try {
      await updateUserPreferences(user.uid, {
        customDisplayName: profileName,
        enabledExpenseCategories: enabledExpenses,
        enabledIncomeCategories: enabledIncome
      });
      await refreshPreferences();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating preferences:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const addCategory = (type: 'expense' | 'income') => {
    const input = type === 'expense' ? newExpenseInput : newIncomeInput;
    const list = type === 'expense' ? enabledExpenses : enabledIncome;
    const setList = type === 'expense' ? setEnabledExpenses : setEnabledIncome;
    const setInput = type === 'expense' ? setNewExpenseInput : setNewIncomeInput;

    const value = input.trim();
    if (!value) return;
    if (list.includes(value)) {
      alert("Category already exists");
      return;
    }
    
    setList([...list, value]);
    setInput("");
  };

  const removeCategory = (type: 'expense' | 'income', category: string) => {
    const list = type === 'expense' ? enabledExpenses : enabledIncome;
    const setList = type === 'expense' ? setEnabledExpenses : setEnabledIncome;
    setList(list.filter(c => c !== category));
  };

  return (
    <div className="flex flex-col space-y-10 max-w-7xl mx-auto px-4 lg:px-0 pb-32">
      
      <PageHeader 
        category="System Configuration"
        title={<>Preferences <span className="text-primary italic font-serif">&</span> Control</>}
        subtitle="Fine-tune your financial intelligence matrix."
        actions={
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-3 bg-on-surface text-surface hover:scale-[1.02] active:scale-95 px-8 py-4 rounded-2xl transition-all font-black uppercase tracking-[0.15em] text-[10px] shadow-2xl disabled:opacity-50 group"
          >
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-surface"></div>
            ) : success ? (
              <><CheckCircle2 className="h-4 w-4" /> Changes Applied</>
            ) : (
              <><Save className="h-4 w-4 group-hover:rotate-12 transition-transform" /> Commit Changes</>
            )}
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sidebar Navigation */}
        <div className="md:col-span-1 pr-6 hidden md:block">
          <div className="sticky top-12 space-y-3">
            {[
              { id: "profile", label: "Identity", icon: User },
              { id: "categories", label: "Categories", icon: Hash },
              { id: "security", label: "Security", icon: ShieldCheck }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex w-full items-center gap-4 px-6 py-4.5 rounded-[1.25rem] font-bold uppercase tracking-[0.15em] text-[10px] transition-all duration-500 border ${
                  activeTab === tab.id 
                    ? "bg-primary/10 text-primary border-primary/20 shadow-glow-primary translate-x-2" 
                    : "text-on-surface-variant/40 hover:bg-white/[0.03] hover:text-on-surface-variant border-transparent"
                }`}
              >
                <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? "text-primary" : "opacity-40"}`} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Navigation Pills */}
        <div className="flex md:hidden gap-3 pb-6 overflow-x-auto no-scrollbar border-b border-white/5">
           {[
              { id: "profile", label: "Identity", icon: User },
              { id: "categories", label: "Categories", icon: Hash },
              { id: "security", label: "Security", icon: ShieldCheck }
            ].map((tab) => (
             <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center whitespace-nowrap gap-2.5 px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all ${
                  activeTab === tab.id 
                    ? "bg-primary/20 text-primary border border-primary/30 shadow-glow-primary" 
                    : "text-on-surface-variant/50 bg-white/[0.03] border border-white/5"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" /> {tab.label}
              </button>
            ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-8">
          
          {activeTab === "profile" && (
            <div className="animate-in slide-in-from-bottom-4 fade-in duration-700">
              <section className="glass-card rounded-[2rem] p-6 md:p-10 space-y-8 bg-white/[0.01]">
                <SectionHeader 
                  title="Identity Matrix" 
                  icon={<User className="h-4 w-4" />}
                />

                <div className="space-y-8 max-w-xl">
                  <div className="group">
                    <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-[0.25em] mb-3 opacity-60 group-focus-within:text-primary transition-colors">Digital Alias</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/5 px-6 py-5 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary/40 focus:bg-white/[0.04] transition-all rounded-2xl font-bold tracking-tight"
                      placeholder="Identify as..."
                    />
                    <p className="text-[10px] text-on-surface-variant/40 mt-3 font-bold uppercase tracking-widest">This alias synchronizes with your dashboard analytics.</p>
                  </div>

                  <div className="opacity-60">
                    <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-[0.25em] mb-3">Linked Core Account</label>
                    <div className="w-full bg-white/[0.01] border border-white/5 px-6 py-5 text-on-surface-variant/50 rounded-2xl font-mono text-sm">
                      {user?.email || "No account detected"}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "categories" && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-700">
              {/* Outflow Categories */}
              <section className="glass-card rounded-[1.5rem] p-6 md:p-8 space-y-6 bg-white/[0.01]">
                <SectionHeader 
                  title="Outflow Categories" 
                  icon={<ArrowUpRight className="h-4 w-4" />}
                />

                <div className="flex flex-wrap gap-3">
                  {enabledExpenses.map(category => (
                    <div
                      key={category}
                      className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/5 text-sm font-bold text-on-surface-variant hover:border-white/20 transition-all group/tag"
                    >
                      {category}
                      <button 
                        onClick={() => removeCategory('expense', category)}
                        className="p-1.5 hover:bg-tertiary/20 rounded-xl text-on-surface-variant/40 hover:text-tertiary transition-all"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex items-center gap-2 group/input ml-2">
                    <input 
                      type="text"
                      value={newExpenseInput}
                      onChange={(e) => setNewExpenseInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCategory('expense')}
                      placeholder="Add Category..."
                      className="bg-transparent border-b border-white/5 px-4 py-2 text-sm font-bold text-on-surface placeholder:text-on-surface-variant/20 focus:outline-none focus:border-tertiary/50 w-40 transition-all"
                    />
                    <button 
                      onClick={() => addCategory('expense')}
                      className="p-2.5 bg-tertiary/10 text-tertiary rounded-xl hover:bg-tertiary/20 transition-all border border-tertiary/20 active:scale-90"
                    >
                      <Plus className="h-4 w-4 stroke-[3px]" />
                    </button>
                  </div>
                </div>
              </section>

              {/* Inflow Categories */}
              <section className="glass-card rounded-[1.5rem] p-6 md:p-8 space-y-6 bg-white/[0.01]">
                <SectionHeader 
                  title="Inflow Categories" 
                  icon={<ArrowDownRight className="h-4 w-4" />}
                />

                <div className="flex flex-wrap gap-3">
                  {enabledIncome.map(category => (
                    <div
                      key={category}
                      className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/5 text-sm font-bold text-on-surface-variant hover:border-white/20 transition-all group/tag"
                    >
                      {category}
                      <button 
                        onClick={() => removeCategory('income', category)}
                        className="p-1.5 hover:bg-secondary/20 rounded-xl text-on-surface-variant/40 hover:text-secondary transition-all"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex items-center gap-2 group/input ml-2">
                    <input 
                      type="text"
                      value={newIncomeInput}
                      onChange={(e) => setNewIncomeInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCategory('income')}
                      placeholder="Add Category..."
                      className="bg-transparent border-b border-white/5 px-4 py-2 text-sm font-bold text-on-surface placeholder:text-on-surface-variant/20 focus:outline-none focus:border-secondary/50 w-40 transition-all"
                    />
                    <button 
                      onClick={() => addCategory('income')}
                      className="p-2.5 bg-secondary/10 text-secondary rounded-xl hover:bg-secondary/20 transition-all border border-secondary/20 active:scale-90"
                    >
                      <Plus className="h-4 w-4 stroke-[3px]" />
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "security" && (
            <div className="animate-in slide-in-from-bottom-4 fade-in duration-700">
              <section className="glass-card rounded-[2rem] p-6 md:p-10 space-y-8 bg-white/[0.01]">
                <SectionHeader 
                  title="Security Vault" 
                  icon={<Key className="h-4 w-4" />}
                />

                <div className="space-y-8 max-w-xl">
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                    <p className="text-sm text-on-surface-variant/80 font-medium leading-relaxed">
                      Your data is encrypted with AES-GCM 256-bit encryption. Your 6-digit PIN is the master key used to unlock your vault. 
                    </p>
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-tertiary/5 border border-tertiary/10">
                      <AlertCircle className="h-5 w-5 text-tertiary shrink-0 mt-0.5" />
                      <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest leading-normal">
                        Changing your PIN will re-encrypt all your transactions and assets. This may take a few moments.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsPinModalOpen(true)}
                    className="flex items-center justify-center gap-3 bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-on-surface px-8 py-5 rounded-2xl transition-all font-black uppercase tracking-[0.2em] text-[10px]"
                  >
                    <Lock className="h-4 w-4 text-primary" />
                    Change Vault PIN
                  </button>
                </div>
              </section>

              <ChangePinModal 
                isOpen={isPinModalOpen} 
                onClose={() => setIsPinModalOpen(false)} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
