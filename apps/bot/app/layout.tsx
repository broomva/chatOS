import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "chatOS Bot",
  description: "Multi-platform AI bot",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
