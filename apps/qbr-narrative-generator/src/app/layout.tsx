import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QBR Narrative Generator",
  description: "Generate deterministic quarterly business review narratives from key insurance metrics."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
