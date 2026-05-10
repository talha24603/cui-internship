"use client";

import { FormEvent, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Card } from "@/components/student/StudentUi";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { authJson } from "@/utils/authClient";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  website: "",
  industry: "",
  description: "",
};

export default function AdminAddCompanyPage() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);
    try {
      const res = await authJson<{ message: string; company?: { name: string } }>("/api/admin/add-company", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
          website: form.website.trim() || undefined,
          industry: form.industry.trim() || undefined,
          description: form.description.trim() || undefined,
        }),
      });
      setMessage(res.company ? `${res.message}: ${res.company.name}` : res.message);
      setForm(initialForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add company");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminShell
      title="Add Company"
      description="Register a company directly in the system. It will be available for internships and supervisor accounts without a student request."
    >
      <Card>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <FormField label="Company name">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </FormField>
          <FormField label="Company email">
            <Input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />
          </FormField>
          <FormField label="Phone">
            <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          </FormField>
          <FormField label="Website">
            <Input value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} />
          </FormField>
          <FormField label="Address" className="sm:col-span-2">
            <Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
          </FormField>
          <FormField label="Industry">
            <Input value={form.industry} onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))} />
          </FormField>
          <FormField label="Description" className="sm:col-span-2">
            <Textarea
              className="min-h-24"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </FormField>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Add company"}
            </Button>
          </div>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </Card>
    </AdminShell>
  );
}
