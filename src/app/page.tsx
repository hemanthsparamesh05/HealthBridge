"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    router.replace(user ? "/dashboard" : "/login");
  }, [router, user]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
      Loading HealthBridge…
    </div>
  );
}
