"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-xl font-semibold text-[var(--hb-ink)]">Reset access</h1>
        <p className="mt-1 text-sm text-[var(--hb-ink-muted)]">
          We&apos;ll email a secure link to reset your password.
        </p>
        <label className="mt-4 block text-xs font-semibold text-[var(--hb-ink-muted)]">
          Email
          <Input className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </label>
        <Button
          className="mt-4 w-full rounded-2xl"
          type="button"
          onClick={() => toast.success("Reset link sent (demo)")}
        >
          Send reset link
        </Button>
        <Link href="/login" className="mt-3 block text-center text-sm font-semibold text-sky-700 hover:underline dark:text-sky-300">
          Return to login
        </Link>
      </Card>
    </div>
  );
}
