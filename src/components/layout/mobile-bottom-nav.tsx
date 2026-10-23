"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ClipboardList, Home, MessageSquare, Search, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/claims", label: "Claims", icon: ClipboardList },
  { href: "/fraud", label: "Fraud", icon: ShieldAlert },
  { href: "/communications", label: "Chat", icon: MessageSquare },
  { href: "/notifications", label: "Alerts", icon: Bell },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const setCommand = useUiStore((s) => s.setCommandOpen);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/80 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden dark:border-slate-800 dark:bg-slate-950/90"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-2">
        {items.map((it) => {
          const active =
            pathname === it.href ||
            (it.href !== "/dashboard" && pathname.startsWith(it.href));
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex min-w-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium",
                active
                  ? "text-sky-700 dark:text-sky-300"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {it.label}
            </Link>
          );
        })}
        <button
          type="button"
          className="flex min-w-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          onClick={() => setCommand(true)}
        >
          <Search className="h-5 w-5" aria-hidden />
          Search
        </button>
      </div>
    </nav>
  );
}
