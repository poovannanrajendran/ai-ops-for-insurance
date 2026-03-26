import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Team Capacity Planner",
  description: "Deterministic team capacity planning from workload and staffing metrics."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
