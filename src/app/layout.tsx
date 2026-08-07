import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "大工黑客松组队中心", template: "%s · 大工黑客松" },
  description: "第二届大工黑客松公开组队与作品展示平台",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={`${geist.variable} ${mono.variable} antialiased`}>
        <SiteHeader />
        <main className="mx-auto min-h-[calc(100vh-8rem)] w-full max-w-6xl px-4 py-8 sm:px-6">
          {children}
        </main>
        <footer className="border-t bg-white/60">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
            <span>大工黑客松组队中心 · 2026</span>
            <span className="font-mono">HACKATHON · TEAM CENTER</span>
          </div>
        </footer>
        <Toaster richColors />
      </body>
    </html>
  );
}
