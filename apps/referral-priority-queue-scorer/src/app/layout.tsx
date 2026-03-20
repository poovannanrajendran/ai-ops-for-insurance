import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Referral Priority Queue Scorer",
  description:
    "Day 9 app for deterministically ranking underwriting referrals by urgency, complexity, and escalation factors."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
