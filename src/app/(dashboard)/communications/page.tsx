"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchMessages } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function CommunicationsPage() {
  const q = useQuery({ queryKey: ["messages"], queryFn: fetchMessages });
  const [draft, setDraft] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--hb-ink)]">
          Communications
        </h1>
        <p className="text-sm text-[var(--hb-ink-muted)]">
          Slack-style threads with claim context, attachments, and AI suggested replies.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle># clm-240891-northlake</CardTitle>
            <CardDescription>Insurer · Hospital · Compliance</CardDescription>
          </CardHeader>
          <div className="max-h-[520px] space-y-3 overflow-y-auto px-5 pb-4">
            {q.isLoading ? (
              <Skeleton className="h-40" />
            ) : (
              (q.data ?? []).map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.from === "insurer" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      m.from === "insurer"
                        ? "bg-sky-600 text-white"
                        : m.ai
                          ? "bg-violet-50 text-violet-950 dark:bg-violet-950/40 dark:text-violet-50"
                          : "bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                    }`}
                  >
                    <p className="text-[11px] font-semibold opacity-80">{m.name}</p>
                    <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                    <p className="mt-2 text-[10px] opacity-70">
                      {new Date(m.at).toLocaleString()} · Read
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2 border-t border-slate-200/70 p-4 dark:border-slate-800">
            <Input
              placeholder="Write a message…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Message composer"
            />
            <Button
              type="button"
              className="shrink-0 rounded-xl"
              onClick={() => {
                if (!draft.trim()) return;
                toast.success("Message sent (demo)");
                setDraft("");
              }}
            >
              Send
            </Button>
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI suggested replies</CardTitle>
            <CardDescription>Grounded on policy + clinical notes</CardDescription>
          </CardHeader>
          <div className="space-y-2 px-5 pb-5 text-sm">
            <button
              type="button"
              className="w-full rounded-2xl border border-slate-200/70 bg-slate-50 p-3 text-left hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-900"
              onClick={() =>
                toast.message("Inserted suggestion", {
                  description: "Request attending attestation for same-day MRI.",
                })
              }
            >
              Request attending attestation for same-day advanced imaging.
            </button>
            <button
              type="button"
              className="w-full rounded-2xl border border-slate-200/70 bg-slate-50 p-3 text-left hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-900"
              onClick={() => toast.message("Inserted suggestion", { description: "Offer peer-to-peer review window." })}
            >
              Offer peer-to-peer clinical review within 48 business hours.
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
