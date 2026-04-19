# Security Policy - Paisa.Log

Paisa.Log is designed with a **Zero-Knowledge Architecture**, ensuring that your sensitive financial data is encrypted before it ever leaves your device.

## Core Security Pillars

### 1. Zero-Knowledge Encryption
All sensitive fields (transaction descriptions, categories, amounts, and portfolio names) are encrypted using **AES-256-GCM**. The encryption happens entirely on the client side.

### 2. Local Key Derivation
Your encryption key is derived from your 6-digit PIN and a unique per-user salt using **PBKDF2** with **100,000 iterations** and SHA-256. 
- **The PIN is never stored on any server.**
- **The derived key is only kept in memory** during your session.

### 3. Infrastructure Hardening
The application implements strict security headers to protect against common web vulnerabilities:
- **Content Security Policy (CSP)**: Restricts script execution to trusted domains and prevents XSS.
- **HSTS**: Forces all connections over HTTPS.
- **X-Frame-Options**: Prevents clickjacking by disabling iframe embedding.
- **X-Content-Type-Options**: Prevents MIME-type sniffing.

### 4. Brute-Force Mitigation
A 2-second artificial delay is enforced on incorrect PIN entries to prevent rapid automated guessing.

## Your Responsibility

> [!IMPORTANT]
> **Your PIN is the master key to your data.** Because Paisa.Log is zero-knowledge, we cannot reset your PIN or recover your data if you forget it.
> - Use a PIN that is easy for you to remember but hard for others to guess.
> - Do not share your PIN with anyone.

## Reporting Vulnerabilities
If you discover a security vulnerability, please report it via the project's repository issues or contact the maintainers directly.
