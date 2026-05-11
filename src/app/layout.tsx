import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/firebase/auth";
import EncryptionGate from "@/components/auth/EncryptionGate";
import { Toaster } from "react-hot-toast";
import MouseTracker from "@/components/ui/MouseTracker";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pl-app.web.app"),
  title: "Paisa.log",
  description: "A premium personal finance tracker.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Paisa.log",
    description: "A premium personal finance tracker.",
    url: "https://pl-app.web.app",
    siteName: "Paisa.log",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Paisa.log Branding",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Paisa.log",
    description: "A premium personal finance tracker.",
    images: ["/opengraph-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Paisa.log",
  },
  icons: {
    icon: "/icon-512x512.png",
    shortcut: "/icon-192x192.png",
    apple: "/icon-512x512.png",
  },
};

export const viewport = {
  themeColor: "#0e0e0e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} min-h-screen antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col font-sans" suppressHydrationWarning>
        <AuthProvider>
          <MouseTracker />
          <EncryptionGate>
            {children}
          </EncryptionGate>
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#060912',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              },
            }}
          />
        </AuthProvider>
        <div id="datepicker-portal" className="relative z-[99999]" />
      </body>
    </html>
  );
}
