/**
 * One-time migration script: Update user category preferences to the new category structure.
 *
 * Run with:
 *   node --experimental-vm-modules scripts/migrate-categories.mjs
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS env var pointing to your Firebase service account key.
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) });

const db = getFirestore();

const NEW_EXPENSE_CATEGORIES = [
  "Grocery",
  "Food & Dining",
  "Transportation",
  "Bills & EMIs",
  "Shopping & Self Care",
  "Vacation",
  "Gifts",
  "Investment Loss",
  "Misc",
];

const NEW_INCOME_CATEGORIES = [
  "Salary",
  "Interest & Gains",
  "Cashback & Rewards",
  "Bonus",
  "Gifts Received",
  "Other",
];

async function run() {
  const usersRef = db.collection("users");
  const snapshot = await usersRef.get();

  console.log(`Found ${snapshot.docs.length} user(s) to migrate...`);

  let migrated = 0;
  for (const userDoc of snapshot.docs) {
    await userDoc.ref.update({
      enabledExpenseCategories: NEW_EXPENSE_CATEGORIES,
      enabledIncomeCategories: NEW_INCOME_CATEGORIES,
      // Reset category usage so old keys don't pollute smart sorting
      categoryUsage: { expense: {}, income: {} },
    });
    console.log(`  ✅ Migrated user: ${userDoc.id}`);
    migrated++;
  }

  console.log(`\nDone. Migrated ${migrated} user(s).`);
}

run().catch(console.error);
