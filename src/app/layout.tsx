import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Net 知己 | Empathic AI 財經平台",
  description: "一個體貼嘅 AI 財經助手，用廣東話同你傾偈，提供市場分析同投資建議。",
  keywords: ["Net知己", "AI財經", "廣東話", "投資", "港股", "財經助手"],
  authors: [{ name: "Net 知己 Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Net 知己 | Empathic AI 財經平台",
    description: "一個體貼嘅 AI 財經助手，用廣東話同你傾偈",
    type: "website",
    locale: "zh_HK",
  },
  twitter: {
    card: "summary_large_image",
    title: "Net 知己 | Empathic AI 財經平台",
    description: "一個體貼嘅 AI 財經助手，用廣東話同你傾偈",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground overflow-x-hidden`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
