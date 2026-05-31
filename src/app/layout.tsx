import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DealFlow — AI 项目发现助手",
  description: "你的 AI 分析师，全天候扫描 Product Hunt、GitHub 等平台，根据你的投资偏好为项目打分，每天推送精选简报。",
  keywords: ["deal sourcing", "项目发现", "天使投资", "AI agent", "创业项目"],
  openGraph: {
    title: "DealFlow — AI 项目发现助手",
    description: "不再错过下一个明星项目。为投资人打造的 AI 项目发现工具。",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
