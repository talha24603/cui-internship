"use client";

import { FormEvent, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Card } from "@/components/student/StudentUi";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { authJson } from "@/utils/authClient";

export default function AdminCreateAccountPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("FACULTY");
  const [companyId, setCompanyId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const res = await authJson<{ message: string; password?: string }>("/api/admin/create-account", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          companyId: role === "SITE_SUPERVISOR" ? companyId : undefined,
        }),
      });
      setMessage(`${res.message}${res.password ? " (Remember to share credentials securely)" : ""}`);
      setName("");
      setEmail("");
      setPassword("");
      setCompanyId("");
      setRole("FACULTY");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account");
    }
  }

  return (
    <AdminShell title="Create Account" description="Provision new user accounts for faculty/supervisors/admins.">
      <Card>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <FormField label="Name"><Input required value={name} onChange={(e) => setName(e.target.value)} /></FormField>
          <FormField label="Email"><Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></FormField>
          <FormField label="Password"><Input required type="text" value={password} onChange={(e) => setPassword(e.target.value)} /></FormField>
          <FormField label="Role">
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="ADMIN">ADMIN</option>
              <option value="FACULTY">FACULTY</option>
              <option value="SITE_SUPERVISOR">SITE_SUPERVISOR</option>
              <option value="USER">USER</option>
            </Select>
          </FormField>
          {role === "SITE_SUPERVISOR" ? (
            <FormField label="Company ID" className="sm:col-span-2">
              <Input value={companyId} onChange={(e) => setCompanyId(e.target.value)} />
            </FormField>
          ) : null}
          <div className="sm:col-span-2">
            <Button type="submit">Create Account</Button>
          </div>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </Card>
    </AdminShell>
  );
}
