import { StatcounterAnalytics } from "@ai-ops/common-ui";
import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Exposure Scenario Modeller",
  description: "Day 16 app in AI Ops for Insurance"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
