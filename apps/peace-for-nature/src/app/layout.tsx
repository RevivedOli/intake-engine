import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peace for Nature",
  description: "Answer a few questions to see how we can help you support nature.",
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
