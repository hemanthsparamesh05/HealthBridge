"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createClaim, fetchClaimFormOptions } from "@/lib/api";

const fieldLabel = "block text-xs font-semibold text-[var(--hb-ink-muted)]";
const selectCls =
  "mt-1 w-full rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-2.5 text-sm text-[var(--hb-ink)] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950/60 dark:focus:border-sky-600 dark:focus:ring-sky-900/40";

const today = () => new Date().toISOString().slice(0, 10);
const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function ApplyClaimPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const opts = useQuery({ queryKey: ["claim-form-options"], queryFn: fetchClaimFormOptions });

  const [form, setForm] = useState({
    policy_id: "",
    hospital_id: "",
    treatment_type: "",
    diagnosis: "",
    procedures: "",
    doctor: "",
    admission_date: today(),
    discharge_date: today(),
    amount: "",
    doctor_fee: "",
    notes: "",
  });
  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const policy = useMemo(
    () => opts.data?.policies.find((p) => p.policyId === form.policy_id),
    [opts.data, form.policy_id],
  );
  const stayDays = useMemo(() => {
    const a = Date.parse(form.admission_date);
    const d = Date.parse(form.discharge_date);
    return Number.isFinite(a) && Number.isFinite(d) ? Math.round((d - a) / 86_400_000) + 1 : 0;
  }, [form.admission_date, form.discharge_date]);

  const submit = useMutation({
    mutationFn: () =>
      createClaim({
        policy_id: form.policy_id,
        hospital_id: opts.data?.fixedHospitalId ?? (form.hospital_id || undefined),
        treatment_type: form.treatment_type.trim(),
        diagnosis: form.diagnosis.trim(),
        procedures: form.procedures
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
        doctor: form.doctor.trim(),
        admission_date: form.admission_date,
        discharge_date: form.discharge_date,
        amount: Number(form.amount),
        doctor_fee: Number(form.doctor_fee || 0),
        notes: form.notes.trim(),
      }),
    onSuccess: (claim) => {
      void queryClient.invalidateQueries({ queryKey: ["claims"] });
      void queryClient.invalidateQueries({ queryKey: ["kpis"] });
      void queryClient.invalidateQueries({ queryKey: ["dash-charts"] });
      toast.success(`Claim ${claim.id} submitted · AI risk ${claim.riskScore.toFixed(0)}/100 (${claim.riskLevel})`);
      router.push(`/claim/${claim.id}`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Submission failed"),
  });

  const validate = (): string | null => {
    if (!form.policy_id) return "Select a policy";
    if (!opts.data?.fixedHospitalId && !form.hospital_id) return "Select the treating hospital";
    if (form.treatment_type.trim().length < 2) return "Enter the treatment";
    if (form.diagnosis.trim().length < 2) return "Enter the diagnosis";
    if (!form.procedures.trim()) return "Enter at least one procedure";
    if (form.doctor.trim().length < 2) return "Enter the treating doctor";
    if (stayDays < 1) return "Discharge date cannot be before admission";
    const amt = Number(form.amount);
    if (!(amt > 0)) return "Enter a claim amount";
    if (policy && amt > policy.sumInsured) return `Amount exceeds sum insured (${inr(policy.sumInsured)})`;
    if (Number(form.doctor_fee || 0) > amt) return "Doctor fee cannot exceed the claim amount";
    return null;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--hb-ink)]">
            Apply for a health insurance claim
          </h1>
          <p className="text-sm text-[var(--hb-ink-muted)]">
            Submit a cashless or reimbursement claim. It is risk-scored by the AI model as soon as you submit.
          </p>
        </div>
        <Link
          href="/claims"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-700 hover:underline dark:text-sky-300"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to claims
        </Link>
      </div>

      {opts.isLoading ? (
        <Skeleton className="h-[520px]" />
      ) : opts.isError ? (
        <Card>
          <CardTitle>Can&apos;t open the claim form</CardTitle>
          <CardDescription className="mt-1">
            {opts.error instanceof Error ? opts.error.message : "Please try again."}
          </CardDescription>
        </Card>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const problem = validate();
            if (problem) {
              toast.error(problem);
              return;
            }
            submit.mutate();
          }}
        >
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Policy & hospital</CardTitle>
                <CardDescription>Who is being treated, and where</CardDescription>
              </div>
            </CardHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <label className={fieldLabel}>
                Policy holder
                <select className={selectCls} value={form.policy_id} onChange={set("policy_id")}>
                  <option value="">Select a policy…</option>
                  {opts.data?.policies.map((p) => (
                    <option key={p.policyId} value={p.policyId}>
                      {p.memberName} · {p.policyId}
                    </option>
                  ))}
                </select>
              </label>
              {opts.data?.fixedHospitalId ? (
                <label className={fieldLabel}>
                  Treating hospital
                  <Input className="mt-1" value={opts.data.hospitals[0]?.name ?? ""} disabled />
                </label>
              ) : (
                <label className={fieldLabel}>
                  Treating hospital
                  <select className={selectCls} value={form.hospital_id} onChange={set("hospital_id")}>
                    <option value="">Select a hospital…</option>
                    {opts.data?.hospitals.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {policy && (
              <div className="mt-4 grid gap-3 rounded-xl border border-sky-200/70 bg-sky-50/70 p-3 text-xs sm:grid-cols-3 dark:border-sky-900/60 dark:bg-sky-950/30">
                <div>
                  <p className="text-[var(--hb-ink-muted)]">Coverage</p>
                  <p className="font-semibold text-[var(--hb-ink)]">{policy.coverageType}</p>
                </div>
                <div>
                  <p className="text-[var(--hb-ink-muted)]">Sum insured</p>
                  <p className="font-semibold text-[var(--hb-ink)]">{inr(policy.sumInsured)}</p>
                </div>
                <div>
                  <p className="text-[var(--hb-ink-muted)]">Valid until</p>
                  <p className="font-semibold text-[var(--hb-ink)]">{policy.validityEnd}</p>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Treatment details</CardTitle>
                <CardDescription>As written in the discharge summary</CardDescription>
              </div>
            </CardHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <label className={fieldLabel}>
                Treatment
                <Input className="mt-1" placeholder="e.g. Laparoscopic cholecystectomy" value={form.treatment_type} onChange={set("treatment_type")} />
              </label>
              <label className={fieldLabel}>
                Diagnosis
                <Input className="mt-1" placeholder="e.g. Cholelithiasis" value={form.diagnosis} onChange={set("diagnosis")} />
              </label>
              <label className={fieldLabel}>
                Procedures (comma separated)
                <Input className="mt-1" placeholder="Lap chole, USG abdomen" value={form.procedures} onChange={set("procedures")} />
              </label>
              <label className={fieldLabel}>
                Treating doctor
                <Input className="mt-1" placeholder="Dr. Sunita Rao, MS" value={form.doctor} onChange={set("doctor")} />
              </label>
              <label className={fieldLabel}>
                Admission date
                <Input className="mt-1" type="date" max={today()} value={form.admission_date} onChange={set("admission_date")} />
              </label>
              <label className={fieldLabel}>
                Discharge date
                <Input className="mt-1" type="date" min={form.admission_date} value={form.discharge_date} onChange={set("discharge_date")} />
              </label>
            </div>
            <p className="mt-2 text-xs text-[var(--hb-ink-muted)]">
              Length of stay: <span className="font-semibold text-[var(--hb-ink)]">{stayDays > 0 ? `${stayDays} day(s)` : "—"}</span>
            </p>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Billing</CardTitle>
                <CardDescription>Amounts in Indian Rupees</CardDescription>
              </div>
            </CardHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <label className={fieldLabel}>
                Total claim amount (₹)
                <Input className="mt-1" type="number" min={1} inputMode="numeric" value={form.amount} onChange={set("amount")} />
              </label>
              <label className={fieldLabel}>
                Doctor / surgeon fee (₹)
                <Input className="mt-1" type="number" min={0} inputMode="numeric" value={form.doctor_fee} onChange={set("doctor_fee")} />
              </label>
              <label className={`${fieldLabel} md:col-span-2`}>
                Notes for the reviewer (optional)
                <textarea
                  rows={3}
                  maxLength={4000}
                  className={selectCls}
                  value={form.notes}
                  onChange={set("notes")}
                />
              </label>
            </div>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-xs text-[var(--hb-ink-muted)]">
              <FileText className="h-3.5 w-3.5" aria-hidden />
              The claim goes to the review queue as Pending, with an AI risk score.
            </p>
            <Button type="submit" disabled={submit.isPending} className="rounded-xl px-6">
              {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
              {submit.isPending ? "Submitting…" : "Submit claim"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
