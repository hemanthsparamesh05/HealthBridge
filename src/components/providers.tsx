"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLayoutEffect, useState } from "react";
import { Toaster } from "sonner";
import { useThemeStore } from "@/stores/ui-store";

function ThemeSync() {
  const dark = useThemeStore((s) => s.dark);

  useLayoutEffect(() => {
    // Disable transitions during theme change for instant application
    document.documentElement.style.transition = "none";
    document.documentElement.classList.toggle("dark", dark);
    
    // Force reflow to apply class changes
    void document.documentElement.offsetHeight;
    
    // Re-enable transitions
    document.documentElement.style.transition = "";
  }, [dark]);

  return null;
}

function ThemedToaster() {
  const dark = useThemeStore((s) => s.dark);
  return (
    <Toaster
      richColors
      closeButton
      position="top-right"
      theme={dark ? "dark" : "light"}
      toastOptions={{
        classNames: {
          toast:
            "backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-lg",
        },
      }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <ThemeSync />
      {children}
      <ThemedToaster />
    </QueryClientProvider>
  );
}
