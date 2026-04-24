"use client";

import { FormEvent, useState } from "react";
import StudentShell from "@/components/student/StudentShell";
import { Card } from "@/components/student/StudentUi";
import { authJson } from "@/utils/authClient";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const initialForm = {
  organizationOverview: "",
  roleDescription: "",
  keyActivities: "",
  toolsTechnologies: "",
  expectedDeliverables: "",
};

export default function AppexCPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const result = await authJson<{ message: string }>("/api/student/appex-c", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save AppEx C");
    } finally {
      setLoading(false);
    }
  }

  return (
    <StudentShell title="AppEx C" description="Internship proposal details.">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-3">
          {Object.keys(initialForm).map((field) => (
            <FormField key={field} label={field.replace(/([A-Z])/g, " $1")}>
              <Textarea
                required
                value={(form as Record<string, string>)[field]}
                onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
                className="min-h-24"
              />
            </FormField>
          ))}

          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save AppEx C"}
          </Button>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </Card>
    </StudentShell>
  );
}
