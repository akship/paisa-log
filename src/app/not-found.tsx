import Link from "next/link";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="relative w-full max-w-md glass-card rounded-[2.5rem] border border-white/10 p-8 md:p-12 shadow-2xl bg-surface-container/95 backdrop-blur-[60px] text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-glow-primary">
          <Compass className="h-8 w-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">
            404 — Void Detected
          </span>
          <h1 className="text-3xl font-black font-display tracking-tight text-white">
            Page Not Found
          </h1>
          <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs mx-auto">
            The ledger sector or pathway you requested does not exist in this matrix.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 py-4 px-8 rounded-2xl bg-primary text-black font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-glow-primary cursor-pointer w-full"
          >
            <Home className="h-4 w-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
