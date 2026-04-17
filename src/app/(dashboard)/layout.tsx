"use client";

import { useAuth } from "@/lib/firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  PieChart,
  LogOut,
  Plus,
  Briefcase
} from "lucide-react";
import NotificationBell from "@/components/layout/NotificationBell";
import { DataProvider } from "@/lib/DataContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, preferences, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();


  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary shadow-glow-primary"></div>
      </div>
    );
  }

  const navItems = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "Portfolio", href: "/portfolio", icon: Briefcase },
    { name: "Analytics", href: "/analytics", icon: PieChart },
  ];

  const displayName = preferences?.customDisplayName || user.displayName || 'User';

  return (
    <DataProvider>
      <div className="flex h-screen w-full bg-[#060912] text-on-surface overflow-hidden relative font-sans selection:bg-primary/30 selection:text-white">

        {/* Background Ornaments - Deep Space Aesthetic */}
        <div className="bg-ornament bg-blob-primary opacity-20 blur-[120px]" />
        <div className="bg-ornament bg-blob-secondary opacity-10 blur-[150px] -top-20" />
        <div className="bg-ornament bg-blob-tertiary opacity-10 blur-[180px] -bottom-40" />

        {/* Desktop Sidebar - Prism Void Style */}
        <aside className="hidden w-72 flex-col m-5 mr-0 rounded-[2.5rem] glass-card backdrop-blur-[60px] border-white/5 md:flex z-50 bg-white/[0.01] shadow-2xl">
          <Link href="/" className="flex h-24 items-center gap-4 px-10 hover:opacity-80 transition-opacity">
            <div className="p-1 rounded-2xl bg-white/5 border border-white/10 shadow-glow-primary overflow-hidden">
              <Image src="/logo.png" alt="Paisa.Log" width={40} height={40} className="object-cover" priority unoptimized />
            </div>
            <span className="text-2xl font-black font-display tracking-tighter text-shadow-glow">
              Paisa<span className="text-primary italic font-serif">.Log</span>
            </span>
          </Link>

          <nav className="flex-1 space-y-2 px-5 py-10">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-4 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-700 group/nav ${isActive
                      ? "bg-primary/10 text-primary shadow-glow-primary border border-primary/20 translate-x-1"
                      : "text-on-surface-variant/40 hover:bg-white/[0.03] hover:text-on-surface border border-transparent hover:translate-x-1"
                    }`}
                >
                  <item.icon className={`h-5 w-5 transition-all duration-500 ${isActive ? 'drop-shadow-[0_0_12px_rgba(132,173,255,0.8)] scale-110' : 'group-hover/nav:scale-110 group-hover/nav:text-on-surface'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-8 mt-auto border-t border-white/5 bg-white/[0.01]">
            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-tertiary/60 bg-tertiary/5 border border-tertiary/10 hover:bg-tertiary/15 hover:text-tertiary transition-all duration-500 active:scale-95"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative min-w-0 overflow-y-auto no-scrollbar pb-32 md:pb-0 z-0">

          {/* Top-Right Profile Container (Desktop Only) */}
          <div className="hidden md:flex absolute top-10 right-10 z-50 items-center gap-4">
            <NotificationBell />
            <Link href="/settings" className="flex items-center hover:scale-[1.02] transition-transform active:scale-95">
              <div className="flex items-center gap-4 px-5 py-3 rounded-3xl glass-card backdrop-blur-xl border-white/10 shadow-xl">
                <div className="flex flex-col items-end min-w-0">
                  <span className="text-xs font-black truncate text-shadow-glow tracking-tight text-right">{displayName}</span>
                  <span className="text-[8px] uppercase tracking-widest text-on-surface-variant/40 font-bold">Profile</span>
                </div>
                <div className="relative group/avatar">
                  <img 
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff`} 
                    alt="User" 
                    className="h-10 w-10 rounded-2xl ring-2 ring-white/10 object-cover relative z-20 shadow-2xl transition-transform duration-500 group-hover/avatar:scale-110" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=U&background=6366f1&color=fff`;
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-secondary border-2 border-[#0a0e1a] z-30 shadow-glow-secondary" />
                  <div className="absolute inset-0 rounded-2xl bg-primary/20 blur opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-500 z-10" />
                </div>
              </div>
            </Link>
          </div>

          {/* Mobile Header */}
          <header className="flex h-24 shrink-0 items-center justify-between glass px-8 md:hidden sticky top-0 z-40 border-b border-white/5">
            <Link href="/" className="flex items-center gap-4">
              <div className="p-1 rounded-xl bg-white/5 border border-white/10 shadow-glow-primary overflow-hidden">
                <Image src="/logo.png" alt="Paisa.Log" width={32} height={32} className="object-cover" priority unoptimized />
              </div>
              <span className="text-xl font-black font-display tracking-tight text-shadow-glow">Paisa<span className="text-primary font-serif italic">.Log</span></span>
            </Link>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <Link href="/settings" className="relative hover:scale-110 transition-transform active:scale-90 group/avatar">
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff`} 
                  alt="User" 
                  className="h-11 w-11 rounded-full ring-2 ring-primary/30 object-cover relative z-20" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=U&background=6366f1&color=fff`;
                  }}
                />
                <div className="absolute inset-0 rounded-full bg-primary/20 blur opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-500 z-10" />
              </Link>
            </div>
          </header>

          {/* Dynamic Page Content */}
          <div className="flex-1 p-6 md:p-10 md:pt-32 lg:p-12 lg:pt-36 animate-in fade-in slide-in-from-bottom-2 duration-1000">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation - Floating Orbital Pill */}
        <div className="fixed bottom-6 left-6 right-6 z-50 md:hidden">
          <nav className="flex h-16 items-center justify-around glass-pill px-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/10 bg-white/[0.02] backdrop-blur-[50px] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 min-w-[64px] transition-all duration-700 relative ${isActive ? "text-primary scale-110 translate-y-[-4px]" : "text-on-surface-variant/40 opacity-60"
                    }`}
                >
                  <item.icon className={`h-6 w-6 transition-all duration-500 ${isActive ? 'drop-shadow-[0_0_15px_rgba(132,173,255,0.7)] stroke-[2.5]' : ''}`} />
                  {isActive && (
                    <>
                      <span className="text-[7px] font-black uppercase tracking-[0.3em] animate-in fade-in slide-in-from-bottom-1 duration-700">{item.name}</span>
                      <div className="absolute -bottom-2 h-1 w-6 bg-primary rounded-full shadow-glow-primary" />
                    </>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>



        {/* Global FAB Controller - Prism Void Aesthetic */}
        {(pathname === "/" || pathname === "/portfolio") && (
          <button
            onClick={() => {
              const eventName = pathname === "/" ? "paisa-open-add-transaction" : "paisa-open-add-portfolio";
              window.dispatchEvent(new CustomEvent(eventName));
            }}
            className="fixed bottom-28 md:bottom-12 right-6 md:right-12 z-[60] flex items-center gap-3 h-14 md:h-16 px-6 md:px-8 rounded-full prism-orb border border-white/10 group cursor-pointer overflow-hidden backdrop-blur-3xl transition-all duration-500 hover:scale-[1.05] shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-1000"
          >
            {/* Prismatic Base Glow (Subtle) */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-primary/5 pointer-events-none group-hover:bg-primary/20 transition-all duration-700" />

            {/* Dynamic Prism Shine (Diagonal Sweep) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-[-100%] left-[-100%] w-[300%] h-[300%] bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-shimmer opacity-40 group-hover:opacity-100 transition-opacity duration-700" />
            </div>

            {/* Action Elements */}
            <Plus className="relative z-10 h-6 w-6 md:h-7 md:w-7 text-primary group-hover:rotate-90 transition-all duration-500 stroke-[3]" />

            <span className="relative z-10 text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-on-surface group-hover:text-primary transition-colors duration-500 whitespace-nowrap">
              New <span className="text-primary italic">{pathname === "/" ? "Record" : "Asset"}</span>
            </span>

            {/* Inner Glass Borders (Multi-layered) */}
            <div className="absolute inset-1 rounded-full border border-white/5 pointer-events-none" />
            <div className="absolute inset-[3px] rounded-full border border-primary/5 pointer-events-none opacity-20" />

            {/* Pulsing Core (Subtle) */}
            <div className="absolute inset-4 rounded-full bg-primary/5 blur-xl group-hover:bg-primary/15 animate-pulse transition-all duration-1000" />
          </button>
        )}
      </div>
    </DataProvider>
  );
}
