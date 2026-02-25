import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | chatOS Docs",
    default: "chatOS Docs",
  },
  description: "Documentation for the chatOS AI chat platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
