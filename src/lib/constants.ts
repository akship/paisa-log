export const BASE_EXPENSE_CATEGORIES = [
  "Grocery",
  "Food & Dining",
  "Transportation",
  "Bills & EMIs",
  "Shopping & Self Care",
  "Vacation",
  "Gifts",
  "Investment Loss",
  "Misc"
];

export const BASE_INCOME_CATEGORIES = [
  "Salary",
  "Interest & Gains",
  "Cashback & Rewards",
  "Bonus",
  "Gifts Received",
  "Other"
];

export const BASE_PORTFOLIO_CATEGORIES = {
  LIQUID: ["Bank Balance", "Cash in Hand"],
  INVESTMENTS: ["Stocks", "Mutual Funds", "Gold", "Fixed Deposits", "PF/PPF", "Other"],
  RECEIVABLES: ["Real Estate", "Vehicles", "Jewelry", "Other Assets"],
  LIABILITIES: ["Loans Taken", "Credit Card debt", "Mortgage/EMI Owed"]
};

export const VAULT_CANARY = "vault-unlocked";

export const MIGRATION_VERSION = 2;

// Category remapping for legacy data
export const EXPENSE_REMAP: Record<string, string> = {
  "Bills & Utilities": "Bills & EMIs",
  "EMI":               "Bills & EMIs",
  "Insurance":         "Bills & EMIs",
  "Shopping":          "Shopping & Self Care",
  "Medicines":         "Shopping & Self Care",
  "Entertainment":     "Misc",
  "Travel":            "Vacation",
  "Taxes":             "Misc",
  "Other":             "Misc",
};

export const INCOME_REMAP: Record<string, string> = {
  "Investment Gain":    "Interest & Gains",
  "Interest/Dividends": "Interest & Gains",
  "Cashback/Rewards":   "Cashback & Rewards",
  "Bussiness":          "Other",
  "Rental Income":      "Other",
};

export const PRISM_COLORS = [
  "#0ea5e9", // Sky 500
  "#06b6d4", // Cyan 500
  "#3b82f6", // Blue 500
  "#6366f1", // Indigo 500
  "#2dd4bf", // Teal 500
  "#38bdf8", // Sky 400
  "#22d3ee", // Cyan 400
  "#60a5fa", // Blue 400
];
