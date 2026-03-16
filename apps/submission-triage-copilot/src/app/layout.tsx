import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Submission Triage Copilot | AI Ops for Insurance",
  description: "Day 1 app for triaging broker submissions against a simple appetite baseline."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
