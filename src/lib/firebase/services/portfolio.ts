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
  deleteDoc,
  updateDoc,
  limit
} from "firebase/firestore";
import { db } from "../config";
import { CryptoUtils } from "../../cryptography";
import { PortfolioItem, PortfolioSnapshot } from "./types";

const PORTFOLIO_COLLECTION = "portfolio";
const PORTFOLIO_HISTORY_COLLECTION = "portfolio_history";

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
    const [name, category, amount] = await Promise.all([
      CryptoUtils.encryptString(item.name, encryptionKey),
      CryptoUtils.encryptString(item.category, encryptionKey),
      CryptoUtils.encryptNumber(item.amount, encryptionKey)
    ]);
    data.name = name;
    data.category = category;
    data.amount = amount;
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
    
    const encryptionPromises = [];
    if (updates.name) encryptionPromises.push(CryptoUtils.encryptString(updates.name, encryptionKey).then(res => data.name = res));
    if (updates.category) encryptionPromises.push(CryptoUtils.encryptString(updates.category, encryptionKey).then(res => data.category = res));
    if (updates.amount !== undefined) encryptionPromises.push(CryptoUtils.encryptNumber(updates.amount, encryptionKey).then(res => data.amount = res));
    
    await Promise.all(encryptionPromises);
  }

  return updateDoc(itemRef, data);
};

export const deletePortfolioItem = async (itemId: string) => {
  const docRef = doc(db, PORTFOLIO_COLLECTION, itemId);
  await deleteDoc(docRef);
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

// --- Portfolio History ---

export const savePortfolioSnapshot = async (
  snapshot: Omit<PortfolioSnapshot, "id" | "timestamp">,
  encryptionKey: CryptoKey | null = null
) => {
  const docRef = collection(db, PORTFOLIO_HISTORY_COLLECTION);
  
  const data: any = {
    ...snapshot,
    timestamp: Timestamp.now(),
    isEncrypted: !!encryptionKey,
    v: encryptionKey ? 1 : null
  };

  if (encryptionKey) {
    const [tnw, liq, inv, rec, lia, itemsStr] = await Promise.all([
      CryptoUtils.encryptNumber(snapshot.totalNetWorth, encryptionKey),
      CryptoUtils.encryptNumber(snapshot.liquid, encryptionKey),
      CryptoUtils.encryptNumber(snapshot.investments, encryptionKey),
      CryptoUtils.encryptNumber(snapshot.receivables, encryptionKey),
      CryptoUtils.encryptNumber(snapshot.liabilities, encryptionKey),
      snapshot.items ? CryptoUtils.encryptString(JSON.stringify(snapshot.items), encryptionKey) : Promise.resolve(null)
    ]);
    
    data.totalNetWorth = tnw;
    data.liquid = liq;
    data.investments = inv;
    data.receivables = rec;
    data.liabilities = lia;
    if (itemsStr) data.items = itemsStr;
  }
  
  const res = await addDoc(docRef, data);
  return res.id;
};

export const deletePortfolioSnapshot = async (snapshotId: string) => {
  const docRef = doc(db, PORTFOLIO_HISTORY_COLLECTION, snapshotId);
  await deleteDoc(docRef);
};

export const subscribeToPortfolioHistory = (
  userId: string,
  callback: (history: PortfolioSnapshot[]) => void,
  encryptionKey: CryptoKey | null = null,
  options: { limitCount?: number } = {},
  errorCallback?: (error: any) => void
) => {
  let q = query(
    collection(db, PORTFOLIO_HISTORY_COLLECTION),
    where("user_id", "==", userId),
    orderBy("monthYear", "desc"),
    orderBy("timestamp", "desc")
  );

  if (options.limitCount) {
    q = query(q, limit(options.limitCount));
  }

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
  }, errorCallback);
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

// Helper logic (usually for contexts)
export const calculatePortfolioTotals = (items: PortfolioItem[]) => {
  const totals = {
    totalNetWorth: 0,
    liquid: 0,
    investments: 0,
    receivables: 0,
    liabilities: 0
  };

  items.forEach(item => {
    const amt = item.amount || 0;
    switch (item.categoryGroup) {
      case "LIQUID":
        totals.liquid += amt;
        totals.totalNetWorth += amt;
        break;
      case "INVESTMENTS":
        totals.investments += amt;
        totals.totalNetWorth += amt;
        break;
      case "RECEIVABLES":
        totals.receivables += amt;
        totals.totalNetWorth += amt;
        break;
      case "LIABILITIES":
        totals.liabilities += amt;
        totals.totalNetWorth -= amt;
        break;
    }
  });

  return totals;
};
