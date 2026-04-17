"use client";

import { useAuth } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Wallet, LogIn } from "lucide-react";

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen min-h-[600px] w-full flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-primary/10 blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-tertiary/10 blur-[120px]"></div>

      <div className="z-10 w-full max-w-md px-6">
        <div className="glass-card flex flex-col items-center p-10 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low/60 to-transparent"></div>
          
          <div className="z-10 bg-primary/10 p-4 rounded-full mb-6 ring-1 ring-primary/20 group-hover:scale-110 transition-transform duration-500">
            <Wallet className="h-10 w-10 text-primary" />
          </div>
          
          <h1 className="z-10 text-3xl font-bold tracking-tight font-display text-on-surface mb-2">
            Paisa<span className="text-primary">.Log</span>
          </h1>
          
          <p className="z-10 text-on-surface-variant mb-10 text-sm">
            Personal finance. Tracked with precision.
          </p>
          
          <button
            onClick={signInWithGoogle}
            className="z-10 flex w-full items-center justify-center gap-3 rounded-full bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 transition-all hover:bg-slate-100 active:scale-95 shadow-lg shadow-white/10"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </div>
        
        <p className="mt-8 text-center text-xs text-on-surface-variant/60">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
