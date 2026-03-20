import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Binder Capacity Monitor",
  description: "Day 11 app for deterministic binder utilization, threshold monitoring, and forecast breach tracking."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
