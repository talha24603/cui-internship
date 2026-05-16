"use client";

import { FormEvent, useEffect, useState } from "react";
import FacultyShell from "@/components/faculty/FacultyShell";
import { Card } from "@/components/student/StudentUi";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { authJson } from "@/utils/authClient";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type Internship = {
  id: string;
  endDate?: string | null;
  student?: { name: string; regNo?: string | null } | null;
};

function buildFacultyInternshipsUrl(endDateFrom: string, endDateTo: string) {
  const p = new URLSearchParams({ status: "approved" });
  const ef = endDateFrom.trim();
  const et = endDateTo.trim();
  if (ef) p.set("endDateFrom", ef);
  if (et) p.set("endDateTo", et);
  return `/api/faculty/internships?${p.toString()}`;
}

function internshipOptionLabel(item: Internship) {
  const name = item.student?.name ?? "Unknown";
  const reg = item.student?.regNo ?? "N/A";
  const end = item.endDate ? item.endDate.slice(0, 10) : "—";
  return `${name} (${reg}) — ends ${end}`;
}

const fields = [
  { key: "platformActivityEngagement", label: "Platform Activity & Engagement" },
  { key: "completionOfInternshipProjects", label: "Completion of Internship Project(s)" },
  { key: "earningsAchieved", label: "Earnings Achieved" },
  { key: "skillDevelopmentLearning", label: "Skill Development & Learning" },
  { key: "clientRatingAndFeedback", label: "Client Rating and Feedback" },
  { key: "professionalismCommunication", label: "Professionalism & Communication" },
] as const;

export default function FacultyEvaluationFormPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [internshipId, setInternshipId] = useState("");
  const [comments, setComments] = useState("");
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(fields.map((f) => [f.key, 1]))
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [endDateFrom, setEndDateFrom] = useState("");
  const [endDateTo, setEndDateTo] = useState("");
  const debouncedEndFrom = useDebouncedValue(endDateFrom, 400);
  const debouncedEndTo = useDebouncedValue(endDateTo, 400);

  useEffect(() => {
    authJson<{ data: Internship[] }>(buildFacultyInternshipsUrl(debouncedEndFrom, debouncedEndTo))
      .then((res) => {
        const list = res.data ?? [];
        setInternships(list);
        setInternshipId((prev) => {
          if (prev && list.some((i) => i.id === prev)) return prev;
          return list[0]?.id ?? "";
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load internships"));
  }, [debouncedEndFrom, debouncedEndTo]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);
    try {
      const res = await authJson<{ message: string }>("/api/faculty/evaluation-form", {
        method: "POST",
        body: JSON.stringify({ internshipId, criteria: scores, comments }),
      });
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit evaluation form");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FacultyShell title="Evaluation Form" description="Submit faculty evaluation criteria for supervised students.">
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Filter: internship ends on or after" hint="Optional (YYYY-MM-DD)">
              <Input type="date" value={endDateFrom} onChange={(e) => setEndDateFrom(e.target.value)} />
            </FormField>
            <FormField label="Filter: internship ends on or before" hint="Optional (YYYY-MM-DD)">
              <Input type="date" value={endDateTo} onChange={(e) => setEndDateTo(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Internship">
            <Select value={internshipId} onChange={(e) => setInternshipId(e.target.value)}>
              <option value="">Select internship</option>
              {internships.map((item) => (
                <option key={item.id} value={item.id}>
                  {internshipOptionLabel(item)}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <FormField key={field.key} label={field.label} hint="Score between 1 and 10">
                <Input
                  type="number"
                  min={1}
                  max={10}
                  required
                  value={scores[field.key]}
                  onChange={(e) => setScores((prev) => ({ ...prev, [field.key]: Number(e.target.value) }))}
                />
              </FormField>
            ))}
          </div>

          <FormField label="Comments">
            <Textarea value={comments} onChange={(e) => setComments(e.target.value)} />
          </FormField>

          <Button type="submit" loading={submitting} loadingText="Submitting…">
            Submit Evaluation Form
          </Button>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </Card>
    </FacultyShell>
  );
}
