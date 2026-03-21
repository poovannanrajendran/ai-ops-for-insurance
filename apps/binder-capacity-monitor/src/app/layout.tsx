import type { Metadata } from "next";
import { StatcounterAnalytics } from "@ai-ops/common-ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "Binder Capacity Monitor",
  description: "Day 11 app for deterministic binder utilization, threshold monitoring, and forecast breach tracking."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        {process.env.NODE_ENV === "production" ? (
          <StatcounterAnalytics
            project={process.env.NEXT_PUBLIC_STATCOUNTER_PROJECT ?? ""}
            security={process.env.NEXT_PUBLIC_STATCOUNTER_SECURITY ?? ""}
          />
        ) : null}
      </body>
    </html>
  );
}
