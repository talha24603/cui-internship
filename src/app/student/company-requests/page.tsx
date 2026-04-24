"use client";

import { FormEvent, useEffect, useState } from "react";
import StudentShell from "@/components/student/StudentShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { authJson } from "@/utils/authClient";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type CompanyRequest = {
  id: string;
  name: string;
  email: string;
  industry?: string | null;
  reason?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
};

const initialForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  website: "",
  industry: "",
  description: "",
  reason: "",
};

export default function CompanyRequestsPage() {
  const [form, setForm] = useState(initialForm);
  const [requests, setRequests] = useState<CompanyRequest[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  async function load() {
    const response = await authJson<{ requests: CompanyRequest[] }>("/api/student/company-request-status");
    setRequests(response.requests ?? []);
    setInitialLoading(false);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Unable to load company requests"));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const res = await authJson<{ message: string }>("/api/student/request-to-add-company", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setMessage(res.message);
      setForm(initialForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit request");
    }
  }

  return (
    <StudentShell
      title="Company Requests"
      description="Request addition of a new company and track approval status."
    >
      <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
        <Card>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Request New Company</h2>
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
            {Object.keys(initialForm).map((field) => (
              <label key={field} className={`text-sm ${field === "description" || field === "reason" ? "sm:col-span-2" : ""}`}>
                <span className="mb-1 block capitalize text-slate-700 dark:text-slate-300">{field}</span>
                {field === "description" || field === "reason" ? (
                  <Textarea
                    value={(form as Record<string, string>)[field]}
                    onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                    className="min-h-24"
                  />
                ) : (
                  <Input
                    type={field === "email" ? "email" : "text"}
                    required={field === "name" || field === "email"}
                    value={(form as Record<string, string>)[field]}
                    onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                  />
                )}
              </label>
            ))}
            <div className="sm:col-span-2">
              <Button>Submit Request</Button>
            </div>
          </form>
          {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
        </Card>

        <Card>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Request History</h2>
          <div className="space-y-3">
            {initialLoading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : requests.length === 0 ? (
              <p className="text-sm text-slate-600">No company requests yet.</p>
            ) : (
              requests.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-xs text-slate-700">{item.email}</p>
                  {item.reason ? <p className="mt-1 text-xs text-slate-600">Reason: {item.reason}</p> : null}
                  {item.notes ? <p className="mt-1 text-xs text-slate-600">Admin notes: {item.notes}</p> : null}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </StudentShell>
  );
}
