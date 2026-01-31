import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lions Den University",
  description: "Work with me – application funnel",
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
