import type { Metadata } from "next";
import { authClient } from "@/lib/auth/client";
import { NeonAuthUIProvider } from "@neondatabase/auth/react/ui";
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
    <html lang="en" className="font-sans" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID !== 'function') {
    crypto.randomUUID = function randomUUID() {
      var bytes = new Uint8Array(16);
      if (typeof crypto.getRandomValues === 'function') {
        crypto.getRandomValues(bytes);
      }
      bytes[6] = (bytes[6] & 15) | 64;
      bytes[8] = (bytes[8] & 63) | 128;
      var h = function(b) { return (b < 16 ? '0' : '') + b.toString(16); };
      return h(bytes[0])+h(bytes[1])+h(bytes[2])+h(bytes[3])+'-'+h(bytes[4])+h(bytes[5])+'-4'+h(bytes[6])+h(bytes[7])+'-'+'89ab'[bytes[8]>>4]+h(bytes[8]&15)+h(bytes[9])+'-'+h(bytes[10])+h(bytes[11])+h(bytes[12])+h(bytes[13])+h(bytes[14])+h(bytes[15]);
    };
  }
})();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <NeonAuthUIProvider authClient={authClient as never} redirectTo="/dashboard">
          {children}
        </NeonAuthUIProvider>
      </body>
    </html>
  );
}
