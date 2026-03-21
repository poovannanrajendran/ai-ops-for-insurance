import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Claims Leakage Flagger",
  description: "Day 14 app in AI Ops for Insurance"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
