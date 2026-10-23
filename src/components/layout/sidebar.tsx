"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Shield,
  X,
} from "lucide-react";
import { navForRole } from "@/config/navigation";
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleCollapsed = useUiStore((s) => s.toggleSidebarCollapsed);
  const mobileOpen = useUiStore((s) => s.sidebarMobileOpen);
  const setMobileOpen = useUiStore((s) => s.setSidebarMobileOpen);

  const items = navForRole(user?.role);
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  const rail = (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/10 bg-[var(--hb-navy)] text-slate-100 transition-[transform,width] duration-200 ease-out",
        "w-72 max-lg:shadow-2xl",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        collapsed ? "lg:w-[72px]" : "lg:w-64",
      )}
    >
      <div className="flex h-16 items-center justify-between gap-2 border-b border-white/10 px-3">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-2 rounded-xl px-1 py-1"
          onClick={() => setMobileOpen(false)}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-500/15 ring-1 ring-sky-400/30">
            <Shield className="h-5 w-5 text-sky-300" aria-hidden />
          </span>
          <span
            className={cn(
              "min-w-0 text-left transition-opacity",
              collapsed ? "lg:opacity-0 lg:pointer-events-none lg:w-0" : "",
            )}
          >
            <span className="block truncate text-sm font-semibold tracking-tight">
              HealthBridge
            </span>
            <span className="block truncate text-[11px] text-slate-400">
              Claims Intelligence
            </span>
          </span>
        </Link>
        <button
          type="button"
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 lg:inline-flex"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ease-out",
                active
                  ? "bg-sky-500/20 text-white ring-1 ring-sky-400/30"
                  : "text-slate-300 hover:bg-white/5 hover:text-white",
                collapsed && "lg:justify-center lg:px-2",
              )}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate",
                  collapsed ? "lg:hidden" : "",
                )}
              >
                {item.label}
              </span>
              {item.badgeKey === "notifications" && unreadCount > 0 ? (
                <span className="ml-auto hidden rounded-full bg-rose-500/90 px-2 py-0.5 text-[10px] font-semibold text-white lg:inline">
                  {unreadCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-200 hover:bg-rose-500/15 hover:text-rose-100",
            collapsed && "lg:justify-center lg:px-2",
          )}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          <span className={cn(collapsed ? "lg:hidden" : "")}>Logout</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {rail}
      <AnimatePresence>
        {mobileOpen ? (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-slate-950 lg:hidden"
            aria-label="Close menu backdrop"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

export function MobileMenuButton() {
  const setOpen = useUiStore((s) => s.setSidebarMobileOpen);
  return (
    <button
      type="button"
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-700 shadow-sm lg:hidden dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200"
      onClick={() => setOpen(true)}
      aria-label="Open navigation menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
