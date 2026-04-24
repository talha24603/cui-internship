"use client";

import { FormEvent, useEffect, useState } from "react";
import StudentShell from "@/components/student/StudentShell";
import { Card } from "@/components/student/StudentUi";
import { authJson } from "@/utils/authClient";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type DropdownItem = { id: string; name: string };

const initialForm = {
  name: "",
  degreeProgram: "",
  email: "",
  semester: "",
  contactNo: "",
  preferredField: "",
  agreementAccepted: true,
  facultyId: "",
  siteId: "",
};
const textFields = ["name", "degreeProgram", "email", "semester", "contactNo", "preferredField"] as const;

export default function AppexBPage() {
  const [form, setForm] = useState(initialForm);
  const [faculty, setFaculty] = useState<DropdownItem[]>([]);
  const [sites, setSites] = useState<DropdownItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      authJson<{ data: DropdownItem[] }>("/api/dropdown/faculty"),
      authJson<{ data: DropdownItem[] }>("/api/dropdown/site-supervisors"),
    ])
      .then(([f, s]) => {
        setFaculty(f.data ?? []);
        setSites(s.data ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load dropdowns"));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        ...form,
        facultyId: form.facultyId || undefined,
        siteId: form.siteId || undefined,
      };
      const result = await authJson<{ message: string }>("/api/student/appex-b", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save AppEx B");
    } finally {
      setLoading(false);
    }
  }

  return (
    <StudentShell title="AppEx B" description="Internship assignment details and supervisor preferences.">
      <Card>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          {textFields.map((field) => (
            <FormField key={field} label={field.replace(/([A-Z])/g, " $1")}>
              <Input
                type={field === "email" ? "email" : "text"}
                required
                value={form[field]}
                onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
              />
            </FormField>
          ))}

          <FormField label="Preferred Faculty">
            <Select
              value={form.facultyId}
              onChange={(e) => setForm((p) => ({ ...p, facultyId: e.target.value }))}
            >
              <option value="">Select faculty</option>
              {faculty.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Preferred Site Supervisor">
            <Select
              value={form.siteId}
              onChange={(e) => setForm((p) => ({ ...p, siteId: e.target.value }))}
            >
              <option value="">Select site supervisor</option>
              {sites.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </FormField>

          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.agreementAccepted}
              onChange={(e) => setForm((p) => ({ ...p, agreementAccepted: e.target.checked }))}
            />
            I confirm the submitted information is correct.
          </label>

          <div className="sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save AppEx B"}
            </Button>
          </div>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </Card>
    </StudentShell>
  );
}
