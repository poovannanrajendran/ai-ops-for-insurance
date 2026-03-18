import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slip Reviewer",
  description:
    "Day 4 app for extracting structured slip fields and highlighting unusual clauses and coverage gaps."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
