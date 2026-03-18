import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Class of Business Classifier",
  description:
    "Day 5 app for classifying free-text risk descriptions into London Market class-of-business labels with confidence and rationale."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
