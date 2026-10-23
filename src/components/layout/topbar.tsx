"use client";

import {
  Bell,
  Bot,
  CalendarRange,
  Cloud,
  Moon,
  Search,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore, useUiStore } from "@/stores/ui-store";
import { MobileMenuButton } from "@/components/layout/sidebar";
import Link from "next/link";

export function Topbar({ title }: { title: string }) {
  const user = useAuthStore((s) => s.user);
  const setCommand = useUiStore((s) => s.setCommandOpen);
  const setAssistant = useUiStore((s) => s.setAssistantOpen);
  const dateLabel = useUiStore((s) => s.dateRangeLabel);
  const setSessionWarn = useUiStore((s) => s.setSessionWarn);
  const toggleDark = useThemeStore((s) => s.toggleDark);
  const dark = useThemeStore((s) => s.dark);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommand(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCommand]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(t)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(t))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const unread = useMemo(
    () => MOCK_NOTIFICATIONS.filter((n) => !n.read).length,
    [],
  );

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--hb-border)] bg-white/80 px-4 py-3 backdrop-blur-xl dark:bg-slate-950/85 lg:px-6">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3">
        <MobileMenuButton />
        <div className="min-w-0 flex-1">
          <h1
            key={title}
            className="truncate text-lg font-semibold tracking-tight text-[var(--hb-ink)]"
          >
            {title}
          </h1>
        </div>

        <div className="hidden items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs text-slate-600 shadow-sm md:flex dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live
          <Cloud className="h-3.5 w-3.5 text-sky-500" aria-hidden />
          <span className="text-slate-400">AES-256</span>
        </div>

        <button
          type="button"
          onClick={() => setCommand(true)}
          className="hidden w-[min(420px,38vw)] items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2 text-left text-sm text-slate-500 shadow-sm lg:flex dark:border-slate-800 dark:bg-slate-950/50"
          aria-label="Open command palette"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1">Search claims, patients, hospitals…</span>
          <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500 dark:border-slate-700 dark:bg-slate-900">
            ⌘K
          </kbd>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-700 shadow-sm lg:hidden dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200"
            aria-label="Search"
            onClick={() => setCommand(true)}
          >
            <Search className="h-4 w-4" />
          </button>

          <div className="hidden items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs text-slate-600 shadow-sm xl:flex dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
            <CalendarRange className="h-4 w-4 text-sky-600" aria-hidden />
            <span className="whitespace-nowrap">{dateLabel}</span>
          </div>

          <button
            type="button"
            onClick={() => setAssistant(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-violet-700 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 dark:text-violet-300"
            aria-label="Open AI assistant"
            title="AI Assistant"
          >
            <Bot className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => toast.message("AI alerts", { description: "No new model drift detected in the last hour." })}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200"
            aria-label="AI alerts"
            title="AI alerts"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
          </button>

          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unread ? (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-950" />
              ) : null}
            </button>
            {notifOpen ? (
              <div className="absolute right-0 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
                <div className="border-b border-slate-200/70 px-4 py-3 text-sm font-semibold dark:border-slate-800">
                  Notifications
                </div>
                <div className="max-h-[360px] overflow-y-auto">
                  {MOCK_NOTIFICATIONS.map((n) => (
                    <Link
                      key={n.id}
                      href="/notifications"
                      className="block border-b border-slate-100/80 px-4 py-3 hover:bg-slate-50 dark:border-slate-900 dark:hover:bg-slate-900/40"
                      onClick={() => setNotifOpen(false)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-[var(--hb-ink)]">
                          {n.title}
                        </p>
                        <span
                          className={cn(
                            "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                            n.priority === "high"
                              ? "bg-rose-500"
                              : n.priority === "medium"
                                ? "bg-amber-500"
                                : "bg-slate-300",
                          )}
                        />
                      </div>
                      <p className="mt-1 text-xs text-[var(--hb-ink-muted)]">
                        {n.body}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={toggleDark}
            className="group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-700 shadow-sm transition-transform duration-200 hover:scale-110 active:scale-95 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200"
            aria-label="Toggle dark mode"
          >
            {dark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-2 py-1.5 pr-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/70"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-xs font-semibold text-white">
                {user?.name?.slice(0, 1) ?? "U"}
              </span>
              <span className="hidden text-left text-xs leading-tight sm:block">
                <span className="block font-semibold text-[var(--hb-ink)]">
                  {user?.name}
                </span>
                <span className="block text-[var(--hb-ink-muted)]">
                  {user?.email}
                </span>
              </span>
              <User className="hidden h-4 w-4 text-slate-400 sm:block" />
            </button>
            {profileOpen ? (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
                <Link
                  href="/settings"
                  className="block px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-900/40"
                  onClick={() => setProfileOpen(false)}
                >
                  Settings & roles
                </Link>
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-900/40"
                  onClick={() => {
                    setSessionWarn(true);
                    setProfileOpen(false);
                    toast.message("Session warning enabled (demo)");
                  }}
                >
                  Preview session timeout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
