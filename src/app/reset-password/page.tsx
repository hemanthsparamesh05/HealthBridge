"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function ResetPasswordPage() {
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-xl font-semibold text-[var(--hb-ink)]">Create a new password</h1>
        <p className="mt-1 text-sm text-[var(--hb-ink-muted)]">
          Use at least 12 characters including numbers and symbols.
        </p>
        <label className="mt-4 block text-xs font-semibold text-[var(--hb-ink-muted)]">
          New password
          <Input className="mt-1" type="password" value={p1} onChange={(e) => setP1(e.target.value)} />
        </label>
        <label className="mt-3 block text-xs font-semibold text-[var(--hb-ink-muted)]">
          Confirm password
          <Input className="mt-1" type="password" value={p2} onChange={(e) => setP2(e.target.value)} />
        </label>
        <Button
          className="mt-4 w-full rounded-2xl"
          type="button"
          onClick={() => {
            if (p1.length < 8 || p1 !== p2) {
              toast.error("Passwords must match and be at least 8 characters (demo rule).");
              return;
            }
            toast.success("Password updated (demo)");
          }}
        >
          Update password
        </Button>
        <Link href="/login" className="mt-3 block text-center text-sm font-semibold text-sky-700 hover:underline dark:text-sky-300">
          Back to login
        </Link>
      </Card>
    </div>
  );
}
