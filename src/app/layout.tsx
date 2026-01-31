import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Intake Engine",
  description: "Multi-tenant onboarding funnel platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="font-sans">
      <body className="antialiased">{children}</body>
    </html>
  );
}
