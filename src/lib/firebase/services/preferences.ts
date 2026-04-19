import { 
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment
} from "firebase/firestore";
import { db } from "../config";
import { BASE_EXPENSE_CATEGORIES, BASE_INCOME_CATEGORIES, BASE_PORTFOLIO_CATEGORIES } from "../../constants";
import { UserPreferences } from "./types";

const USERS_COLLECTION = "users";

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
  const fieldPath = `categoryUsage.${type}.${category.replace(/\./g, '_')}`;
  
  try {
    await updateDoc(docRef, {
      [fieldPath]: increment(1)
    });
  } catch (err) {
    console.log("Category usage increment skipped (doc might not exist yet)");
  }
};
