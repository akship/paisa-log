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
  writeBatch,
  limit,
  QueryConstraint
} from "firebase/firestore";
import { db } from "../config";
import { CryptoUtils } from "../../cryptography";
import { Transaction } from "./types";
import { incrementCategoryUsage } from "./preferences";

const TRANSACTIONS_COLLECTION = "transactions";

export interface SubscriptionOptions {
  limitCount?: number;
  startDate?: Date;
}

export const subscribeToTransactions = (
  userId: string, 
  callback: (transactions: Transaction[]) => void,
  encryptionKey: CryptoKey | null = null,
  options?: SubscriptionOptions,
  errorCallback?: (error: any) => void
) => {
  const constraints: QueryConstraint[] = [
    where("user_id", "==", userId),
    orderBy("timestamp", "desc")
  ];

  if (options?.startDate) {
    constraints.push(where("timestamp", ">=", Timestamp.fromDate(options.startDate)));
  }

  // Note: Firestore doesn't allow combining inequality on one field with limit easily 
  // if we want "at least X records" across different ranges.
  // For now, if limit exists, apply it.
  if (options?.limitCount) {
    constraints.push(limit(options.limitCount));
  }

  const q = query(
    collection(db, TRANSACTIONS_COLLECTION),
    ...constraints
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
  date: Date,
  category: string,
  description: string,
  encryptionKey: CryptoKey | null = null
) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where("user_id", "==", userId),
    where("timestamp", ">=", Timestamp.fromDate(startOfDay)),
    where("timestamp", "<=", Timestamp.fromDate(endOfDay)),
    orderBy("timestamp", "desc")
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return false;

  for (const d of querySnapshot.docs) {
    const data = d.data();
    
    // 1. Direct match for unencrypted legacy data
    if (!data.isEncrypted) {
      if (data.amount === amount && data.category === category && data.description === description) return true;
    } 
    // 2. Precision match for encrypted data if key is available
    else if (encryptionKey) {
      try {
        const [decryptedAmount, decryptedCat, decryptedDesc] = await Promise.all([
          CryptoUtils.decryptNumber(data.amount, encryptionKey),
          CryptoUtils.decryptString(data.category, encryptionKey),
          CryptoUtils.decryptString(data.description, encryptionKey)
        ]);
        if (decryptedAmount === amount && decryptedCat === category && decryptedDesc === description) return true;
      } catch (err) {
        console.warn("Could not verify encrypted duplicate:", d.id);
      }
    }
  }

  return false;
};

export const addTransaction = async (transaction: Omit<Transaction, "id">, encryptionKey: CryptoKey | null = null) => {
  const data: any = {
    ...transaction,
    timestamp: Timestamp.fromDate(transaction.timestamp),
    isEncrypted: !!encryptionKey,
    v: encryptionKey ? 1 : null
  };

  if (encryptionKey) {
    const [description, category, amount] = await Promise.all([
      CryptoUtils.encryptString(transaction.description, encryptionKey),
      CryptoUtils.encryptString(transaction.category, encryptionKey),
      CryptoUtils.encryptNumber(transaction.amount, encryptionKey)
    ]);
    data.description = description;
    data.category = category;
    data.amount = amount;
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
    
    const encryptionPromises = [];
    if (data.description) encryptionPromises.push(CryptoUtils.encryptString(data.description, encryptionKey).then(res => updateData.description = res));
    if (data.category) encryptionPromises.push(CryptoUtils.encryptString(data.category, encryptionKey).then(res => updateData.category = res));
    if (data.amount !== undefined) encryptionPromises.push(CryptoUtils.encryptNumber(data.amount, encryptionKey).then(res => updateData.amount = res));
    
    await Promise.all(encryptionPromises);
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

export const deleteTransaction = async (transactionId: string) => {
  const docRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
  await deleteDoc(docRef);
};
