"use client";

import { FileSpreadsheet, FileText, Timer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const reports = [
  { title: "Claims utilization", desc: "Line-level detail with DRG mapping." },
  { title: "Fraud & SIU", desc: "Escalations, model scores, investigator notes." },
  { title: "Hospital scorecard", desc: "Turnaround, denials, and medical necessity." },
  { title: "Monthly insurance statistics", desc: "Premium, loss ratio, reserves." },
  { title: "AI prediction report", desc: "Model versions, drift, and explainability." },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--hb-ink)]">
          Reports & analytics
        </h1>
        <p className="text-sm text-[var(--hb-ink-muted)]">
          Export compliance-ready packs or schedule recurring distribution.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((r) => (
          <Card key={r.title}>
            <CardHeader>
              <CardTitle>{r.title}</CardTitle>
              <CardDescription>{r.desc}</CardDescription>
            </CardHeader>
            <div className="flex flex-wrap gap-2 px-5 pb-5">
              <Button
                variant="secondary"
                className="rounded-xl"
                type="button"
                onClick={() => toast.success("PDF queued (demo)")}
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
              <Button
                variant="secondary"
                className="rounded-xl"
                type="button"
                onClick={() => toast.success("Excel generated (demo)")}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
              <Button
                className="rounded-xl"
                type="button"
                onClick={() => toast.message("Schedule saved", { description: "Mondays 06:00 PT · encrypted inbox" })}
              >
                <Timer className="h-4 w-4" />
                Schedule
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
