"use client";

import { FormEvent, useEffect, useState } from "react";
import StudentShell from "@/components/student/StudentShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { authJson } from "@/utils/authClient";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Complaint = {
  id: string;
  subject: string;
  body: string;
  category: string;
  status: string;
  createdAt: string;
};

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  async function load() {
    const result = await authJson<{ complaints: Complaint[] }>("/api/student/complaints");
    setComplaints(result.complaints ?? []);
    setInitialLoading(false);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Unable to load complaints"));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const res = await authJson<{ message: string }>("/api/student/complaints", {
        method: "POST",
        body: JSON.stringify({ subject, body, category }),
      });
      setMessage(res.message);
      setSubject("");
      setBody("");
      setCategory("GENERAL");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit complaint");
    }
  }

  return (
    <StudentShell title="Complaints" description="Submit concerns and track their status.">
      <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
        <Card>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Submit Complaint</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <FormField label="Subject">
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" required />
            </FormField>
            <FormField label="Category">
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="GENERAL">GENERAL</option>
                <option value="INTERNSHIP_SITE">INTERNSHIP_SITE</option>
                <option value="FACULTY">FACULTY</option>
                <option value="PLACEMENT_OFFICE">PLACEMENT_OFFICE</option>
                <option value="OTHER">OTHER</option>
              </Select>
            </FormField>
            <FormField label="Complaint Details" hint="Describe issue clearly for faster resolution.">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your complaint"
                required
                className="min-h-32"
              />
            </FormField>
            <Button>Submit</Button>
          </form>
          {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
        </Card>

        <Card>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Your Complaints</h2>
          <div className="space-y-3">
            {initialLoading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : complaints.length === 0 ? (
              <p className="text-sm text-slate-600">No complaints submitted yet.</p>
            ) : (
              complaints.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{item.subject}</p>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{item.category}</p>
                  <p className="mt-1 text-xs text-slate-700">{item.body}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </StudentShell>
  );
}
