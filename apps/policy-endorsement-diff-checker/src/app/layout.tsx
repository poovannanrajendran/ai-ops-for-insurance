import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Policy Endorsement Diff Checker",
  description: "Day 8 app for deterministic expiring-versus-renewal endorsement comparison and material change detection."
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
