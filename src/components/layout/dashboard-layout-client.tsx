"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useTopTitle } from "@/components/layout/use-top-title";
import { CommandPalette } from "@/components/layout/command-palette";
import { AiAssistantPanel } from "@/components/layout/ai-assistant-panel";
import { SessionTimeoutBanner } from "@/components/layout/session-timeout-banner";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SecurityTrustStrip } from "@/components/layout/security-trust-strip";
import { PageTransition } from "@/components/layout/page-transition";
import { cn } from "@/lib/utils";

export function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const mfaPending = useAuthStore((s) => s.mfaPending);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const title = useTopTitle();

  useEffect(() => {
    if (mfaPending) {
      router.replace("/mfa");
      return;
    }
    if (!user) router.replace("/login");
  }, [user, mfaPending, router]);

  if (mfaPending || !user) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-sm text-slate-500">
        Securing your workspace…
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh]">
      <Sidebar />
      <div
        className={cn(
          "flex min-h-[100dvh] flex-col transition-[padding-left] duration-200 lg:pl-64",
          collapsed && "lg:pl-[72px]",
        )}
      >
        <Topbar title={title} />
        <SessionTimeoutBanner />
        <SecurityTrustStrip />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 pb-28 pt-4 lg:px-8 lg:pb-10">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
      <MobileBottomNav />
      <CommandPalette />
      <AiAssistantPanel />
    </div>
  );
}
