"use client";

import { FormEvent, useEffect, useState } from "react";
import StudentShell from "@/components/student/StudentShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { authJson } from "@/utils/authClient";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type AppexA = Record<string, string> & { status?: string };
type CompanyItem = { id: string; name: string; industry?: string };

const initialForm = {
  organization: "",
  address: "",
  industrySector: "",
  contactName: "",
  contactDesignation: "",
  contactPhone: "",
  contactEmail: "",
  internshipLocation: "",
  internshipNature: "",
  mode: "",
  numberOfInternship: "",
  startDate: "",
  endDate: "",
  workingDays: "",
  workingHours: "",
};

export default function AppexAPage() {
  const [form, setForm] = useState(initialForm);
  const [existing, setExisting] = useState<AppexA | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [companyResults, setCompanyResults] = useState<CompanyItem[]>([]);

  async function searchCompanies(query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      setCompanyResults([]);
      return;
    }
    const res = await authJson<{ data: CompanyItem[] }>(`/api/dropdown/companies?search=${encodeURIComponent(trimmed)}`);
    setCompanyResults(res.data ?? []);
  }

  async function resolveApprovedCompanyName(inputName: string) {
    const query = inputName.trim();
    if (!query) {
      throw new Error("Company name is required.");
    }
    const res = await authJson<{ data: CompanyItem[] }>(`/api/dropdown/companies?search=${encodeURIComponent(query)}`);
    const results = res.data ?? [];
    if (results.length === 0) {
      throw new Error("Selected company is not in approved companies list.");
    }
    const exact = results.find((item) => item.name.trim().toLowerCase() === query.toLowerCase());
    if (exact) return exact.name;
    if (results.length > 1) {
      throw new Error("Multiple companies matched. Please choose one from search results.");
    }
    return results[0].name;
  }

  useEffect(() => {
    authJson<{ appexA: AppexA }>("/api/student/appex-a")
      .then((data) => {
        setExisting(data.appexA);
        setForm({
          ...initialForm,
          ...Object.fromEntries(Object.entries(data.appexA).map(([k, v]) => [k, String(v ?? "")])),
          startDate: data.appexA.startDate ? String(data.appexA.startDate).slice(0, 10) : "",
          endDate: data.appexA.endDate ? String(data.appexA.endDate).slice(0, 10) : "",
        });
      })
      .catch(() => undefined);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const resolvedOrganization = await resolveApprovedCompanyName(form.organization);
      const method = existing ? "PUT" : "POST";
      const result = await authJson<{ message: string }>("/api/student/appex-a", {
        method,
        body: JSON.stringify({ ...form, organization: resolvedOrganization }),
      });
      setMessage(result.message);
      const refreshed = await authJson<{ appexA: AppexA }>("/api/student/appex-a");
      setExisting(refreshed.appexA);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save AppEx A");
    } finally {
      setLoading(false);
    }
  }

  return (
    <StudentShell title="AppEx A" description="Submit your internship approval form.">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Fill complete details as these are reviewed by faculty/admin.
          </p>
          {existing?.status ? <StatusBadge status={existing.status} /> : null}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          {Object.keys(initialForm).map((field) => (
            <FormField key={field} label={field.replace(/([A-Z])/g, " $1")}>
              {field === "organization" ? (
                <div className="space-y-1">
                  <Input
                    required
                    placeholder="Search approved company..."
                    value={form.organization}
                    onChange={async (e) => {
                      const nextValue = e.target.value;
                      setForm((prev) => ({ ...prev, organization: nextValue }));
                      await searchCompanies(nextValue);
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
                            setForm((prev) => ({ ...prev, organization: company.name }));
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
              ) : (
                <Input
                  type={field.toLowerCase().includes("date") ? "date" : "text"}
                  required
                  value={(form as Record<string, string>)[field]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
                />
              )}
            </FormField>
          ))}

          <div className="sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : existing ? "Update AppEx A" : "Submit AppEx A"}
            </Button>
          </div>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </Card>
    </StudentShell>
  );
}
