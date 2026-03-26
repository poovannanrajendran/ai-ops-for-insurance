import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Data Quality Validator",
  description: "Day 24 app in AI Ops for Insurance"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
