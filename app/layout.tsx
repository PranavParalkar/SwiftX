import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinTech Wallet — Zero-fee Remittance",
  description:
    "Send money home with no fees, transparent FX, and AI-powered financial guidance.",
  manifest: "/manifest.json",
  applicationName: "FinTech Wallet",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FinTech Wallet",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-neutral-100 dark:bg-neutral-950">
        {children}
      </body>
    </html>
  );
}
