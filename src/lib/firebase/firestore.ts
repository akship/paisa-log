import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  Timestamp, 
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  writeBatch
} from "firebase/firestore";
import { db } from "./config";
import { BASE_EXPENSE_CATEGORIES, BASE_INCOME_CATEGORIES, BASE_PORTFOLIO_CATEGORIES } from "../constants";
import { CryptoUtils } from "../cryptography";

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

const TRANSACTIONS_COLLECTION = "transactions";
const USERS_COLLECTION = "users";
const PORTFOLIO_COLLECTION = "portfolio";
const PORTFOLIO_HISTORY_COLLECTION = "portfolio_history";

export const subscribeToTransactions = (
  userId: string, 
  callback: (transactions: Transaction[]) => void,
  encryptionKey: CryptoKey | null = null,
  errorCallback?: (error: any) => void
) => {
  const q = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where("user_id", "==", userId),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(q, async (snapshot) => {
    const transactionPromises = snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const tx: Transaction = {
        id: doc.id,
        user_id: data.user_id,
        type: data.type,
        amount: data.amount,
        category: data.category,
        description: data.description,
        timestamp: data.timestamp.toDate(),
        isEncrypted: data.isEncrypted || false,
        v: data.v
      };

      if (tx.isEncrypted) {
        tx.description = "[Locked Data]";
        tx.category = "Unknown";
        tx.amount = 0;

        if (encryptionKey) {
          try {
            const [desc, cat, amt] = await Promise.all([
              CryptoUtils.decryptString(data.description, encryptionKey),
              CryptoUtils.decryptString(data.category, encryptionKey),
              CryptoUtils.decryptNumber(data.amount, encryptionKey)
            ]);
            tx.description = desc;
            tx.category = cat;
            tx.amount = amt;
          } catch (err) {
            console.warn("Failed to decrypt transaction:", tx.id);
            tx.decryptionFailed = true;
          }
        }
      }
      return tx;
    });

    const transactions = await Promise.all(transactionPromises);
    callback(transactions);
  }, errorCallback);
};

export const getAllUserTransactions = async (userId: string, encryptionKey: CryptoKey | null = null): Promise<Transaction[]> => {
  const q = query(collection(db, TRANSACTIONS_COLLECTION), where("user_id", "==", userId));
  const snapshot = await getDocs(q);
  
  const transactionPromises = snapshot.docs.map(async (doc) => {
    const data = doc.data();
    const tx: Transaction = {
      id: doc.id,
      user_id: data.user_id,
      type: data.type,
      amount: data.amount,
      category: data.category,
      description: data.description,
      timestamp: data.timestamp.toDate(),
      isEncrypted: data.isEncrypted || false,
      v: data.v
    };

    if (tx.isEncrypted) {
      tx.description = "[Locked Data]";
      tx.category = "Unknown";
      tx.amount = 0;

      if (encryptionKey) {
        try {
          const [desc, cat, amt] = await Promise.all([
            CryptoUtils.decryptString(data.description, encryptionKey),
            CryptoUtils.decryptString(data.category, encryptionKey),
            CryptoUtils.decryptNumber(data.amount, encryptionKey)
          ]);
          tx.description = desc;
          tx.category = cat;
          tx.amount = amt;
        } catch (err) {
          console.warn("Failed to decrypt transaction during migration check:", tx.id);
          tx.decryptionFailed = true;
        }
      }
    }
    return tx;
  });
  
  return Promise.all(transactionPromises);
};

export const checkDuplicateTransaction = async (
  userId: string,
  amount: number,
  date: Date
) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // NOTE: Amounts are encrypted in Firestore for secure users.
  // We query by date only and match the plaintext amount in-memory,
  // which covers both encrypted (amount field is ciphertext string) and
  // legacy unencrypted (amount is a number) documents.
  const q = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where("user_id", "==", userId),
    where("timestamp", ">=", Timestamp.fromDate(startOfDay)),
    where("timestamp", "<=", Timestamp.fromDate(endOfDay))
  );

  const querySnapshot = await getDocs(q);
  // For unencrypted transactions we can match on amount directly.
  // Encrypted entries cannot be compared here — just flag any same-day transaction.
  if (querySnapshot.empty) return false;
  const hasUnencryptedMatch = querySnapshot.docs.some(
    (d) => !d.data().isEncrypted && d.data().amount === amount
  );
  const hasEncryptedEntries = querySnapshot.docs.some((d) => d.data().isEncrypted);
  return hasUnencryptedMatch || hasEncryptedEntries;
};

export const addTransaction = async (transaction: Omit<Transaction, "id">, encryptionKey: CryptoKey | null = null) => {
  const data: any = {
    ...transaction,
    timestamp: Timestamp.fromDate(transaction.timestamp),
    isEncrypted: !!encryptionKey,
    v: encryptionKey ? 1 : null
  };

  if (encryptionKey) {
    data.description = await CryptoUtils.encryptString(transaction.description, encryptionKey);
    data.category = await CryptoUtils.encryptString(transaction.category, encryptionKey);
    data.amount = await CryptoUtils.encryptNumber(transaction.amount, encryptionKey);
  }

  const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), data);
  
  // Update category usage for smart sorting
  await incrementCategoryUsage(transaction.user_id, transaction.type, transaction.category);
  
  return docRef.id;
};

export const updateTransaction = async (transactionId: string, data: Partial<Transaction>, encryptionKey: CryptoKey | null = null) => {
  const docRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
  const updateData: any = { ...data };
  
  if (data.timestamp) {
    updateData.timestamp = Timestamp.fromDate(data.timestamp);
  }

  if (encryptionKey) {
    updateData.isEncrypted = true;
    updateData.v = 1;
    if (data.description) updateData.description = await CryptoUtils.encryptString(data.description, encryptionKey);
    if (data.category) updateData.category = await CryptoUtils.encryptString(data.category, encryptionKey);
    if (data.amount !== undefined) updateData.amount = await CryptoUtils.encryptNumber(data.amount, encryptionKey);
  }
  
  await updateDoc(docRef, updateData);
};

export const bulkUpdateTransactions = async (
  updates: { id: string; data: Partial<Transaction> }[],
  encryptionKey: CryptoKey | null = null
) => {
  const batch = writeBatch(db);
  
  const processPromises = updates.map(async ({ id, data }) => {
    const docRef = doc(db, TRANSACTIONS_COLLECTION, id);
    const updateData: any = { ...data };
    
    if (data.timestamp) {
      updateData.timestamp = Timestamp.fromDate(data.timestamp);
    }

    if (encryptionKey) {
      updateData.isEncrypted = true;
      updateData.v = 1;
      if (data.description) updateData.description = await CryptoUtils.encryptString(data.description, encryptionKey);
      if (data.category) updateData.category = await CryptoUtils.encryptString(data.category, encryptionKey);
      if (data.amount !== undefined) updateData.amount = await CryptoUtils.encryptNumber(data.amount, encryptionKey);
    }
    
    batch.update(docRef, updateData);
  });

  await Promise.all(processPromises);
  await batch.commit();
};

// --- User Profile & Preferences ---

export const getUserPreferences = async (userId: string): Promise<UserPreferences> => {
  const defaultPrefs: UserPreferences = {
    enabledExpenseCategories: [...BASE_EXPENSE_CATEGORIES],
    enabledIncomeCategories: [...BASE_INCOME_CATEGORIES],
    portfolioCategories: { ...BASE_PORTFOLIO_CATEGORIES },
    categoryUsage: {
      expense: {},
      income: {}
    }
  };

  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return defaultPrefs;
    }

    const data = docSnap.data();
    return {
      customDisplayName: data.customDisplayName,
      encryptionSalt: data.encryptionSalt,
      pinVerificationToken: data.pinVerificationToken,
      enabledExpenseCategories: data.enabledExpenseCategories || defaultPrefs.enabledExpenseCategories,
      enabledIncomeCategories: data.enabledIncomeCategories || defaultPrefs.enabledIncomeCategories,
      portfolioCategories: data.portfolioCategories || defaultPrefs.portfolioCategories,
      categoryUsage: data.categoryUsage || defaultPrefs.categoryUsage,
      migrationVersion: data.migrationVersion ?? 0,
    };
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return defaultPrefs;
  }
};

export const updateUserPreferences = async (userId: string, data: Partial<UserPreferences>) => {
  const docRef = doc(db, USERS_COLLECTION, userId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    // Initialize if first time
    const initialPrefs: UserPreferences = {
      enabledExpenseCategories: [...BASE_EXPENSE_CATEGORIES],
      enabledIncomeCategories: [...BASE_INCOME_CATEGORIES],
      portfolioCategories: { ...BASE_PORTFOLIO_CATEGORIES },
      categoryUsage: { expense: {}, income: {} },
      ...data
    };
    await setDoc(docRef, initialPrefs);
  } else {
    await updateDoc(docRef, data);
  }
};

export const incrementCategoryUsage = async (userId: string, type: "income" | "expense", category: string) => {
  const docRef = doc(db, USERS_COLLECTION, userId);
  const fieldPath = `categoryUsage.${type}.${category.replace(/\./g, '_')}`; // Avoid nested field issues
  
  try {
    await updateDoc(docRef, {
      [fieldPath]: increment(1)
    });
  } catch (err) {
    // If doc doesn't exist, ignore (will be handled by first settings save or we could initialize here)
    console.log("Category usage increment skipped (doc might not exist yet)");
  }
};

export const deleteTransaction = async (transactionId: string) => {
  const docRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
  await deleteDoc(docRef);
};





// --- Portfolio CRUD ---

export const subscribeToPortfolio = (
  userId: string,
  callback: (items: PortfolioItem[]) => void,
  encryptionKey: CryptoKey | null = null,
  errorCallback?: (error: any) => void
) => {
  const q = query(
    collection(db, PORTFOLIO_COLLECTION),
    where("user_id", "==", userId),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(q, async (snapshot) => {
    const itemPromises = snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const item: PortfolioItem = {
        id: doc.id,
        user_id: data.user_id,
        name: data.name,
        categoryGroup: data.categoryGroup,
        category: data.category,
        amount: data.amount,
        timestamp: data.timestamp.toDate(),
        isEncrypted: data.isEncrypted || false,
        v: data.v
      };

      if (item.isEncrypted) {
        item.name = "[Locked Portfolio Item]";
        item.category = "Locked";
        item.amount = 0;

        if (encryptionKey) {
          try {
            const [name, cat, amt] = await Promise.all([
              CryptoUtils.decryptString(data.name, encryptionKey),
              CryptoUtils.decryptString(data.category, encryptionKey),
              CryptoUtils.decryptNumber(data.amount, encryptionKey)
            ]);
            item.name = name;
            item.category = cat;
            item.amount = amt;
          } catch (err) {
            console.warn("Failed to decrypt portfolio item:", item.id);
            item.decryptionFailed = true;
          }
        }
      }
      return item;
    });

    const items = await Promise.all(itemPromises);
    callback(items);
  }, errorCallback);
};

export const addPortfolioItem = async (item: Omit<PortfolioItem, "id">, encryptionKey: CryptoKey | null = null) => {
  const data: any = {
    ...item,
    timestamp: Timestamp.fromDate(item.timestamp),
    isEncrypted: !!encryptionKey,
    v: encryptionKey ? 1 : null
  };

  if (encryptionKey) {
    data.name = await CryptoUtils.encryptString(item.name, encryptionKey);
    data.category = await CryptoUtils.encryptString(item.category, encryptionKey);
    data.amount = await CryptoUtils.encryptNumber(item.amount, encryptionKey);
  }

  return addDoc(collection(db, PORTFOLIO_COLLECTION), data);
};

export const updatePortfolioItem = async (id: string, updates: Partial<PortfolioItem>, encryptionKey: CryptoKey | null = null) => {
  const itemRef = doc(db, PORTFOLIO_COLLECTION, id);
  const data: any = { ...updates };
  
  if (updates.timestamp) {
    data.timestamp = Timestamp.fromDate(updates.timestamp);
  }

  if (encryptionKey) {
    data.isEncrypted = true;
    data.v = 1;
    if (updates.name) data.name = await CryptoUtils.encryptString(updates.name, encryptionKey);
    if (updates.category) data.category = await CryptoUtils.encryptString(updates.category, encryptionKey);
    if (updates.amount !== undefined) data.amount = await CryptoUtils.encryptNumber(updates.amount, encryptionKey);
  }

  return updateDoc(itemRef, data);
};

export const deletePortfolioItem = async (itemId: string) => {
  const docRef = doc(db, PORTFOLIO_COLLECTION, itemId);
  await deleteDoc(docRef);
};

// --- Portfolio History ---

export const savePortfolioSnapshot = async (
  snapshot: Omit<PortfolioSnapshot, "id" | "timestamp">,
  encryptionKey: CryptoKey | null = null
) => {
  const docId = `${snapshot.user_id}_${snapshot.monthYear}`;
  const docRef = doc(db, PORTFOLIO_HISTORY_COLLECTION, docId);
  
  const data: any = {
    ...snapshot,
    timestamp: Timestamp.now(),
    isEncrypted: !!encryptionKey,
    v: encryptionKey ? 1 : null
  };

  if (encryptionKey) {
    data.totalNetWorth = await CryptoUtils.encryptNumber(snapshot.totalNetWorth, encryptionKey);
    data.liquid = await CryptoUtils.encryptNumber(snapshot.liquid, encryptionKey);
    data.investments = await CryptoUtils.encryptNumber(snapshot.investments, encryptionKey);
    data.receivables = await CryptoUtils.encryptNumber(snapshot.receivables, encryptionKey);
    data.liabilities = await CryptoUtils.encryptNumber(snapshot.liabilities, encryptionKey);
    if (snapshot.items) {
      data.items = await CryptoUtils.encryptString(JSON.stringify(snapshot.items), encryptionKey);
    }
  }
  
  await setDoc(docRef, data);
  return docId;
};

export const deletePortfolioSnapshot = async (snapshotId: string) => {
  const docRef = doc(db, PORTFOLIO_HISTORY_COLLECTION, snapshotId);
  await deleteDoc(docRef);
};

export const subscribeToPortfolioHistory = (
  userId: string,
  callback: (history: PortfolioSnapshot[]) => void,
  encryptionKey: CryptoKey | null = null
) => {
  const q = query(
    collection(db, PORTFOLIO_HISTORY_COLLECTION),
    where("user_id", "==", userId),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(q, async (snapshot) => {
    const historyPromises = snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const s: PortfolioSnapshot = {
        id: doc.id,
        user_id: data.user_id,
        monthYear: data.monthYear,
        totalNetWorth: data.totalNetWorth,
        liquid: data.liquid,
        investments: data.investments,
        receivables: data.receivables,
        liabilities: data.liabilities,
        timestamp: data.timestamp.toDate(),
        isEncrypted: data.isEncrypted || false,
        v: data.v,
        items: data.items
      };

      if (s.isEncrypted) {
        s.totalNetWorth = 0;
        s.liquid = 0;
        s.investments = 0;
        s.receivables = 0;
        s.liabilities = 0;

        if (encryptionKey) {
          try {
            const [tnw, liq, inv, rec, lia, itemsStr] = await Promise.all([
              CryptoUtils.decryptNumber(data.totalNetWorth, encryptionKey),
              CryptoUtils.decryptNumber(data.liquid, encryptionKey),
              CryptoUtils.decryptNumber(data.investments, encryptionKey),
              CryptoUtils.decryptNumber(data.receivables, encryptionKey),
              CryptoUtils.decryptNumber(data.liabilities, encryptionKey),
              data.items ? CryptoUtils.decryptString(data.items, encryptionKey) : Promise.resolve(null)
            ]);
            
            s.totalNetWorth = tnw;
            s.liquid = liq;
            s.investments = inv;
            s.receivables = rec;
            s.liabilities = lia;
            if (itemsStr) s.items = JSON.parse(itemsStr);
          } catch (err) {
            console.warn("Failed to decrypt portfolio snapshot:", s.id);
            s.totalNetWorth = 0;
            s.decryptionFailed = true;
          }
        }
      }
      return s;
    });

    const history = await Promise.all(historyPromises);
    callback(history);
  });
};

export const getAllUserPortfolioItems = async (userId: string, encryptionKey: CryptoKey | null = null): Promise<PortfolioItem[]> => {
  const q = query(collection(db, PORTFOLIO_COLLECTION), where("user_id", "==", userId));
  const snapshot = await getDocs(q);
  
  const itemPromises = snapshot.docs.map(async (doc) => {
    const data = doc.data();
    const item: PortfolioItem = {
      id: doc.id,
      user_id: data.user_id,
      name: data.name,
      categoryGroup: data.categoryGroup,
      category: data.category,
      amount: data.amount,
      timestamp: data.timestamp.toDate(),
      isEncrypted: data.isEncrypted || false,
      v: data.v
    };

    if (item.isEncrypted) {
      item.name = "[Locked Portfolio Item]";
      item.category = "Locked";
      item.amount = 0;

      if (encryptionKey) {
        try {
          const [name, cat, amt] = await Promise.all([
            CryptoUtils.decryptString(data.name, encryptionKey),
            CryptoUtils.decryptString(data.category, encryptionKey),
            CryptoUtils.decryptNumber(data.amount, encryptionKey)
          ]);
          item.name = name;
          item.category = cat;
          item.amount = amt;
        } catch (err) {
          console.warn("Failed to decrypt portfolio item during migration check:", item.id);
          item.decryptionFailed = true;
        }
      }
    }
    return item;
  });

  return Promise.all(itemPromises);
};

export const getAllUserPortfolioHistory = async (userId: string, encryptionKey: CryptoKey | null = null): Promise<PortfolioSnapshot[]> => {
  const q = query(collection(db, PORTFOLIO_HISTORY_COLLECTION), where("user_id", "==", userId));
  const snapshot = await getDocs(q);
  
  const historyPromises = snapshot.docs.map(async (doc) => {
    const data = doc.data();
    const s: PortfolioSnapshot = {
      id: doc.id,
      user_id: data.user_id,
      monthYear: data.monthYear,
      totalNetWorth: data.totalNetWorth,
      liquid: data.liquid,
      investments: data.investments,
      receivables: data.receivables,
      liabilities: data.liabilities,
      timestamp: data.timestamp.toDate(),
      isEncrypted: data.isEncrypted || false,
      v: data.v
    };

    if (s.isEncrypted && encryptionKey) {
      try {
        const [tnw, liq, inv, rec, lia, itemsStr] = await Promise.all([
          CryptoUtils.decryptNumber(data.totalNetWorth, encryptionKey),
          CryptoUtils.decryptNumber(data.liquid, encryptionKey),
          CryptoUtils.decryptNumber(data.investments, encryptionKey),
          CryptoUtils.decryptNumber(data.receivables, encryptionKey),
          CryptoUtils.decryptNumber(data.liabilities, encryptionKey),
          data.items ? CryptoUtils.decryptString(data.items, encryptionKey) : Promise.resolve(null)
        ]);
        
        s.totalNetWorth = tnw;
        s.liquid = liq;
        s.investments = inv;
        s.receivables = rec;
        s.liabilities = lia;
        if (itemsStr) s.items = JSON.parse(itemsStr);
      } catch (err) {
        console.warn("Failed to decrypt portfolio snapshot during migration check:", s.id);
        s.decryptionFailed = true;
      }
    }
    return s;
  });

  return Promise.all(historyPromises);
};
