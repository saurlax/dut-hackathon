import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "大工黑客松组队中心", template: "%s · 大工黑客松" },
  description: "第二届大工黑客松公开组队与作品展示平台",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="relative flex min-h-screen flex-col">
          <div className="grain-overlay" aria-hidden="true" />
          <SiteHeader />
          <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 md:py-12">
            {children}
          </main>
          <footer className="relative z-10 border-t border-primary/15 bg-white/60 backdrop-blur-sm">
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span className="label-mono">大工黑客松 S2 组队中心 · 2026</span>
              <span className="font-mono">DUT HACKATHON / TEAM CENTER</span>
            </div>
          </footer>
          <Toaster richColors />
        </div>
      </body>
    </html>
  );
}
