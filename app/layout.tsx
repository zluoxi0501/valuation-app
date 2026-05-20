import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "未来方向实验室",
  description: "帮你重新看清：未来到底该往哪里努力。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
