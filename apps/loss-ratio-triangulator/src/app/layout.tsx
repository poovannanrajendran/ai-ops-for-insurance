import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Loss Ratio Triangulator",
  description: "Run deterministic chain-ladder projections and IBNR estimates from cumulative or incremental loss triangles."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
