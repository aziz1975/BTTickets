/* app/layout.tsx */
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavbarClient from "./components/NavbarClient";
import { WalletProvider } from "./context/WalletContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TRON Ecosystem",
  description: "On-chain ticket system for the TRON | BTTC ecosystem",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Global wallet context */}
        <WalletProvider>
          <NavbarClient />
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
