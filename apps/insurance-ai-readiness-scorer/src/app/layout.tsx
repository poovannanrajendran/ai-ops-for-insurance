import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Insurance AI Readiness Scorer",
  description: "Score AI readiness maturity and generate a deterministic 90-day operating plan."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
