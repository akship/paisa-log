"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./config";
import { getUserPreferences, UserPreferences } from "./firestore";
import { exportVaultKey, importVaultKey } from "@/lib/cryptography";

type AuthContextType = {
  user: User | null;
  preferences: UserPreferences | null;
  encryptionKey: CryptoKey | null;
  setEncryptionKey: (key: CryptoKey | null, sync?: boolean) => void;
  loading: boolean;
  isVaultLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  preferences: null,
  encryptionKey: null,
  setEncryptionKey: () => {},
  loading: true,
  isVaultLoading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
  refreshPreferences: async () => {},
});

const VAULT_CHANNEL = "vault-sync";
const SESSION_KEY = "fintrack_vault_key";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVaultLoading, setIsVaultLoading] = useState(true);

  // Synchronize key across tabs and sessions
  useEffect(() => {
    if (typeof window === "undefined") return;

    const channel = new BroadcastChannel(VAULT_CHANNEL);

    channel.onmessage = async (event) => {
      const { type, payload } = event.data;

      if (type === "REQUEST_KEY" && encryptionKey) {
        const jwk = await exportVaultKey(encryptionKey);
        channel.postMessage({ type: "PROVIDE_KEY", payload: jwk });
      } else if (type === "PROVIDE_KEY" && !encryptionKey && payload) {
        const key = await importVaultKey(payload);
        setEncryptionKey(key);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
        setIsVaultLoading(false);
      }
    };

    // Attempt to restore from sessionStorage first (for same-tab refresh)
    const restoreSession = async () => {
      const savedJwk = sessionStorage.getItem(SESSION_KEY);
      if (savedJwk && !encryptionKey) {
        try {
          const key = await importVaultKey(JSON.parse(savedJwk));
          setEncryptionKey(key);
        } catch (e) {
          console.error("Failed to restore session key:", e);
          sessionStorage.removeItem(SESSION_KEY);
        }
      } else if (!encryptionKey) {
        // If no session, ask other tabs
        channel.postMessage({ type: "REQUEST_KEY" });
        // Give it a second to respond, then stop loading
        setTimeout(() => setIsVaultLoading(false), 1000);
        return;
      }
      setIsVaultLoading(false);
    };

    if (user) {
      restoreSession();
    } else {
      setIsVaultLoading(false);
    }

    return () => channel.close();
  }, [user, encryptionKey]);

  const updateEncryptionKey = async (key: CryptoKey | null, sync = true) => {
    setEncryptionKey(key);
    setIsVaultLoading(false);
    if (key) {
      const jwk = await exportVaultKey(key);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(jwk));
      if (sync) {
        const channel = new BroadcastChannel(VAULT_CHANNEL);
        channel.postMessage({ type: "PROVIDE_KEY", payload: jwk });
        channel.close();
      }
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  };

  const refreshPreferences = async () => {
    if (user) {
      const prefs = await getUserPreferences(user.uid);
      setPreferences(prefs);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const prefs = await getUserPreferences(currentUser.uid);
          setPreferences(prefs);
        } catch (error) {
          console.error("Auth preferences fetch failed:", error);
        }
      } else {
        setUser(null);
        setPreferences(null);
        setEncryptionKey(null);
        sessionStorage.removeItem(SESSION_KEY);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setPreferences(null);
      setEncryptionKey(null);
      sessionStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      preferences, 
      encryptionKey, 
      setEncryptionKey: updateEncryptionKey, 
      loading, 
      isVaultLoading,
      signInWithGoogle, 
      logout, 
      refreshPreferences 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
