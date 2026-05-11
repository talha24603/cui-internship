"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Card } from "@/components/student/StudentUi";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { authJson } from "@/utils/authClient";

type CompanyItem = { id: string; name: string; industry?: string };

export default function AdminCreateAccountPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("FACULTY");
  const [companyId, setCompanyId] = useState("");
  const [companyQuery, setCompanyQuery] = useState("");
  const [companyResults, setCompanyResults] = useState<CompanyItem[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (role !== "SITE_SUPERVISOR") {
      setCompanyId("");
      setCompanyQuery("");
      setCompanyResults([]);
    }
  }, [role]);

  async function searchCompanies(query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      setCompanyResults([]);
      return;
    }
    const res = await authJson<{ data: CompanyItem[] }>(
      `/api/dropdown/companies?search=${encodeURIComponent(trimmed)}`
    );
    setCompanyResults(res.data ?? []);
  }

  async function resolveCompanyIdFromQuery(query: string): Promise<string> {
    const q = query.trim();
    if (!q) {
      throw new Error("Search and select a company by name.");
    }
    const res = await authJson<{ data: CompanyItem[] }>(
      `/api/dropdown/companies?search=${encodeURIComponent(q)}`
    );
    const results = res.data ?? [];
    if (results.length === 0) {
      throw new Error(`No company found for "${q}".`);
    }
    const exact = results.find((item) => item.name.trim().toLowerCase() === q.toLowerCase());
    if (exact) return exact.id;
    if (results.length > 1) {
      throw new Error("Several companies matched. Pick one from the list below.");
    }
    return results[0].id;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setCreating(true);
    try {
      let resolvedCompanyId = companyId;
      if (role === "SITE_SUPERVISOR") {
        resolvedCompanyId = companyId || (await resolveCompanyIdFromQuery(companyQuery));
      }

      const res = await authJson<{ message: string; password?: string }>("/api/admin/create-account", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          companyId: role === "SITE_SUPERVISOR" ? resolvedCompanyId : undefined,
        }),
      });
      setMessage(`${res.message}${res.password ? " (Remember to share credentials securely)" : ""}`);
      setName("");
      setEmail("");
      setPassword("");
      setCompanyId("");
      setCompanyQuery("");
      setCompanyResults([]);
      setRole("FACULTY");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account");
    } finally {
      setCreating(false);
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
            <FormField label="Company" className="sm:col-span-2">
              <div className="space-y-1">
                <Input
                  required
                  placeholder="Search company by name..."
                  value={companyQuery}
                  onChange={async (e) => {
                    const v = e.target.value;
                    setCompanyQuery(v);
                    setCompanyId("");
                    await searchCompanies(v);
                  }}
                />
                {companyResults.length > 0 ? (
                  <div className="max-h-36 overflow-auto rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                    {companyResults.slice(0, 8).map((company) => (
                      <button
                        key={company.id}
                        type="button"
                        className="block w-full border-b border-slate-100 px-3 py-2 text-left text-xs hover:bg-slate-50 last:border-b-0 dark:border-slate-800 dark:hover:bg-slate-800"
                        onClick={() => {
                          setCompanyId(company.id);
                          setCompanyQuery(company.name);
                          setCompanyResults([]);
                        }}
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-100">{company.name}</span>
                        <span className="ml-2 text-slate-500 dark:text-slate-400">{company.industry ?? ""}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </FormField>
          ) : null}
          <div className="sm:col-span-2">
            <Button type="submit" loading={creating} loadingText="Creating…">
              Create Account
            </Button>
          </div>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </Card>
    </AdminShell>
  );
}
