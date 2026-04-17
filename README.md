# Paisa.Log 🪙
**Secure. Private. Glassmorphic. Your finance, unlocked only by you.**

Paisa.Log is a premium personal finance tracker designed with a "Privacy First" philosophy. Using high-end **zero-knowledge encryption**, your financial data is encrypted locally on your device before it ever touches the cloud.

[![Version](https://img.shields.io/badge/version-1.0.0-blueviolet)](https://github.com/akship/paisa-log/releases/tag/v1.0.0)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://paisa-log.web.app)
[![Tech Stack](https://img.shields.io/badge/tech-Next.js%20|%20Firebase%20|%20Tailwind-blue)](https://github.com/akship/paisa-log)

---

## ✨ Features

### 🔒 Privacy Above All
*   **Zero-Knowledge Encryption**: All sensitive data (amounts, categories, descriptions) is encrypted using the Web Crypto API (**AES-GCM**) with your personal PIN.
*   **Local Keys**: Decryption keys never leave your browser session. Not even the database administrators can see your records.

### 🎨 Prism Void Design System
*   **Stunning Aesthetics**: A modern, premium dashboard featuring a custom glassmorphic aesthetic.
*   **Responsive & Fluid**: Optimized for all devices with smooth transitions and subtle micro-animations.

### 📊 Powerful Tracking
*   **Global Overview**: Real-time tracking of Income, Expenses, and Total Balance at a glance.
*   **Portfolio Management**: Complete tracking for Assets (Liquid, Investments, Receivables) and Liabilities.
*   **Deep Analytics**: Interactive charts and MoM (Month-over-Month) net worth growth tracking.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Style**: [Tailwind CSS](https://tailwindcss.com/) with specialized glassmorphism utilities.
- **Backend/Auth**: [Firebase](https://firebase.google.com/) (Firestore, Auth, Hosting).
- **Security**: Web Crypto API (**SubtleCrypto**) for client-side encryption.
- **Icons**: [Lucide React](https://lucide.dev/).
- **Feedback**: [React Hot Toast](https://react-hot-toast.com/).

---

## 🚀 Getting Started

To run Paisa.Log locally:

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/akship/paisa-log.git
    cd paisa-log
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env.local` file in the root and add your Firebase configurations:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=paisa-log
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=paisa-log.firebasestorage.app
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

---

## 🛡️ Security Implementation

Paisa.Log implements a standard zero-knowledge architecture:
1.  **Key Derivation**: Your 6-digit PIN is combined with a unique user salt and processed via **PBKDF2** (100,000 iterations) to derive a 256-bit AES key.
2.  **Data Protection**: Every record is encrypted using **AES-GCM** with a unique Initialization Vector (IV).
3.  **Verification**: A "canary" token is stored in your profile to verify PIN correctness without storing the PIN or the derived key itself.

---

Live at: [**paisa-log.web.app**](https://paisa-log.web.app)
