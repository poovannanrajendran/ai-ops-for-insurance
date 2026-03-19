import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Exposure Accumulation Heatmap",
  description:
    "Day 6 app for parsing exposure CSV inputs and surfacing accumulation hotspots by location and TIV."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
