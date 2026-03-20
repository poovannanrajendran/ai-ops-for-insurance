import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claims FNOL Triage Assistant",
  description: "Day 10 app for deterministic first-notice-of-loss triage, claims routing, and escalation guidance."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
