import { Timestamp } from "firebase/firestore";

export interface Transaction {
  id?: string;
  user_id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  timestamp: Date;
  isEncrypted?: boolean;
  v?: number; // Version of encryption
  decryptionFailed?: boolean;
}

export interface PortfolioCategories {
  LIQUID: string[];
  INVESTMENTS: string[];
  RECEIVABLES: string[];
  LIABILITIES: string[];
}

export type PortfolioCategoryGroup = keyof PortfolioCategories;

export interface PortfolioItem {
  id?: string;
  user_id: string;
  name: string;
  categoryGroup: PortfolioCategoryGroup;
  category: string;
  amount: number;
  timestamp: Date;
  isEncrypted?: boolean;
  v?: number;
  decryptionFailed?: boolean;
}

export interface PortfolioSnapshotItem {
  name: string;
  amount: number;
}

export interface PortfolioSnapshot {
  id?: string;
  user_id: string;
  monthYear: string; // YYYY-MM
  totalNetWorth: number;
  liquid: number;
  investments: number;
  receivables: number;
  liabilities: number;
  items?: Record<string, PortfolioSnapshotItem[]>;
  timestamp: Date;
  isEncrypted?: boolean;
  v?: number;
  decryptionFailed?: boolean;
}

export interface UserPreferences {
  customDisplayName?: string;
  encryptionSalt?: string; // High-entropy salt for PBKDF2
  pinVerificationToken?: string; // Encrypted "canary" for PIN verification
  enabledExpenseCategories: string[];
  enabledIncomeCategories: string[];
  portfolioCategories: PortfolioCategories;
  categoryUsage: {
    expense: Record<string, number>;
    income: Record<string, number>;
  };
  migrationVersion?: number; // Bumped when categories are restructured
}
