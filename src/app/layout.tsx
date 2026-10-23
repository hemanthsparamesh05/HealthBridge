import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ThemeBootScript } from "@/components/theme-boot-script";

export const metadata: Metadata = {
  title: "HealthBridge India | Claims Intelligence",
  description:
    "Healthcare claims, TPA workflows, fraud detection, and insurer–hospital collaboration for India.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="min-h-full antialiased">
        <ThemeBootScript />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
