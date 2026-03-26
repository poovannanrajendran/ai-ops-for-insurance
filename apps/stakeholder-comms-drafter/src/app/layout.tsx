import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Stakeholder Comms Drafter",
  description: "Draft deterministic stakeholder communications from structured operational inputs."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
