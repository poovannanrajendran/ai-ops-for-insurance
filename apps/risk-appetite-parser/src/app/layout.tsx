import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Risk Appetite Parser",
  description:
    "Day 3 app for extracting structured appetite fields from underwriting statement text and PDFs."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
