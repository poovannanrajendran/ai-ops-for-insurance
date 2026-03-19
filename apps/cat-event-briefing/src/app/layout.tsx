import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cat Event Briefing",
  description:
    "Day 7 app for deterministic catastrophe event briefing, impacted class triage, and referral-ready action recommendations."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
