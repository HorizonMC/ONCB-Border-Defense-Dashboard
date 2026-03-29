import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบป้องกันพื้นที่ชายแดน",
  description: "Border Area Defense Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
