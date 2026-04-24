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

type Internship = { id: string; student?: { name: string; regNo?: string | null } | null };

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

  useEffect(() => {
    authJson<{ data: Internship[] }>("/api/faculty/internships?status=approved")
      .then((res) => {
        setInternships(res.data ?? []);
        if (res.data?.[0]?.id) setInternshipId(res.data[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load internships"));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const res = await authJson<{ message: string }>("/api/faculty/evaluation-form", {
        method: "POST",
        body: JSON.stringify({ internshipId, criteria: scores, comments }),
      });
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit evaluation form");
    }
  }

  return (
    <FacultyShell title="Evaluation Form" description="Submit faculty evaluation criteria for supervised students.">
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField label="Internship">
            <Select value={internshipId} onChange={(e) => setInternshipId(e.target.value)}>
              <option value="">Select internship</option>
              {internships.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.student?.name ?? "Unknown"} ({item.student?.regNo ?? "N/A"})
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

          <Button type="submit">Submit Evaluation Form</Button>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </Card>
    </FacultyShell>
  );
}
