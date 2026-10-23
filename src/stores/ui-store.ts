"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiState {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  commandOpen: boolean;
  assistantOpen: boolean;
  sessionWarn: boolean;
  dateRangeLabel: string;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarMobileOpen: (v: boolean) => void;
  setCommandOpen: (v: boolean) => void;
  setAssistantOpen: (v: boolean) => void;
  setSessionWarn: (v: boolean) => void;
  setDateRangeLabel: (v: string) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  commandOpen: false,
  assistantOpen: false,
  sessionWarn: false,
  dateRangeLabel: "12 May – 12 Jun, 2026",
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  toggleSidebarCollapsed: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarMobileOpen: (v) => set({ sidebarMobileOpen: v }),
  setCommandOpen: (v) => set({ commandOpen: v }),
  setAssistantOpen: (v) => set({ assistantOpen: v }),
  setSessionWarn: (v) => set({ sessionWarn: v }),
  setDateRangeLabel: (v) => set({ dateRangeLabel: v }),
}));

interface ThemeState {
  dark: boolean;
  toggleDark: () => void;
  setDark: (v: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      dark: false,
      toggleDark: () => set((s) => ({ dark: !s.dark })),
      setDark: (v) => set({ dark: v }),
    }),
    {
      name: "hb-theme",
      onRehydrateStorage: () => (state) => {
        if (typeof document === "undefined") return;
        if (state?.dark) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
      },
    },
  ),
);
