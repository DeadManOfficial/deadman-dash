import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeadMan Dashboard",
  description: "Bug bounty recon & security operations dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
