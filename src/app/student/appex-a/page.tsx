"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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

const ALLOWED_MODES = ["onsite", "remote", "hybrid", "fiverr", "freelance"];
const MIN_INTERNSHIP_WEEKS = 6;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d][\d\s\-()]{6,19}$/;

type FormShape = typeof initialForm;
type FormErrors = Partial<Record<keyof FormShape, string>>;

function validateForm(values: FormShape): FormErrors {
  const errors: FormErrors = {};
  const trim = (s: string) => s.trim();

  const lenCheck = (
    key: keyof FormShape,
    label: string,
    min: number,
    max: number
  ) => {
    const v = trim(values[key]);
    if (v.length < min || v.length > max) {
      errors[key] = `${label} must be ${min}-${max} characters`;
    }
  };

  lenCheck("organization", "Organization", 2, 200);
  lenCheck("address", "Address", 5, 500);
  lenCheck("industrySector", "Industry sector", 2, 100);
  lenCheck("contactName", "Contact name", 2, 100);
  lenCheck("contactDesignation", "Contact designation", 2, 100);
  lenCheck("internshipLocation", "Internship location", 2, 200);
  lenCheck("internshipNature", "Internship nature", 2, 200);
  lenCheck("workingDays", "Working days", 2, 100);
  lenCheck("workingHours", "Working hours", 2, 100);

  if (!PHONE_REGEX.test(trim(values.contactPhone))) {
    errors.contactPhone = "Enter a valid phone (digits, +, -, () allowed)";
  }
  if (!EMAIL_REGEX.test(trim(values.contactEmail))) {
    errors.contactEmail = "Enter a valid email address";
  }
  if (!ALLOWED_MODES.includes(trim(values.mode).toLowerCase())) {
    errors.mode = `Mode must be one of: ${ALLOWED_MODES.join(", ")}`;
  }

  const num = Number(values.numberOfInternship);
  if (
    !Number.isInteger(num) ||
    num < 1 ||
    num > 100 ||
    values.numberOfInternship.trim() === ""
  ) {
    errors.numberOfInternship = "Enter an integer between 1 and 100";
  }

  if (!values.startDate) errors.startDate = "Start date is required";
  if (!values.endDate) errors.endDate = "End date is required";
  if (values.startDate && values.endDate) {
    const start = new Date(values.startDate);
    const end = new Date(values.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      errors.startDate = errors.startDate ?? "Invalid date";
      errors.endDate = errors.endDate ?? "Invalid date";
    } else if (start >= end) {
      errors.endDate = "End date must be after start date";
    } else {
      const weeks = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7);
      if (weeks < MIN_INTERNSHIP_WEEKS) {
        errors.endDate = `Duration must be at least ${MIN_INTERNSHIP_WEEKS} weeks`;
      }
    }
  }

  return errors;
}

const FIELD_LABELS: Record<keyof FormShape, string> = {
  organization: "Organization",
  address: "Address",
  industrySector: "Industry sector",
  contactName: "Contact name",
  contactDesignation: "Contact designation",
  contactPhone: "Contact phone",
  contactEmail: "Contact email",
  internshipLocation: "Internship location",
  internshipNature: "Internship nature",
  mode: "Mode",
  numberOfInternship: "Number of interns",
  startDate: "Start date",
  endDate: "End date",
  workingDays: "Working days",
  workingHours: "Working hours",
};

const FIELD_PLACEHOLDERS: Record<keyof FormShape, string> = {
  organization: "Search approved company...",
  address: "e.g. Plot 12, Street 4, Sector G-9, Islamabad",
  industrySector: "e.g. Information Technology",
  contactName: "e.g. Ahmed Khan",
  contactDesignation: "e.g. HR Manager",
  contactPhone: "e.g. +92 300 1234567",
  contactEmail: "e.g. hr@company.com",
  internshipLocation: "e.g. Islamabad, Pakistan",
  internshipNature: "e.g. Full Stack Web Development",
  mode: "Select mode",
  numberOfInternship: "e.g. 1",
  startDate: "YYYY-MM-DD",
  endDate: "YYYY-MM-DD",
  workingDays: "e.g. Mon-Fri",
  workingHours: "e.g. 9:00 AM - 5:00 PM",
};

const FIELD_HINTS: Partial<Record<keyof FormShape, string>> = {
  contactPhone: "7-20 digits, may include +, -, () and spaces",
  contactEmail: "Use a valid email like name@company.com",
  numberOfInternship: "Integer between 1 and 100",
  endDate: `Internship duration must be at least ${MIN_INTERNSHIP_WEEKS} weeks`,
};

function inputTypeFor(field: keyof FormShape) {
  if (field === "contactEmail") return "email";
  if (field === "contactPhone") return "tel";
  if (field === "numberOfInternship") return "number";
  if (field === "startDate" || field === "endDate") return "date";
  return "text";
}

export default function AppexAPage() {
  const [form, setForm] = useState<FormShape>(initialForm);
  const [existing, setExisting] = useState<AppexA | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormShape, boolean>>>({});
  const [companyResults, setCompanyResults] = useState<CompanyItem[]>([]);

  const liveErrors = useMemo(() => validateForm(form), [form]);

  function updateField(field: keyof FormShape, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function markTouched(field: keyof FormShape) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function errorFor(field: keyof FormShape) {
    if (fieldErrors[field]) return fieldErrors[field];
    if (touched[field]) return liveErrors[field];
    return undefined;
  }

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

  async function resolveApprovedCompanyName(inputName: string) {
    const query = inputName.trim();
    if (!query) {
      throw new Error("Company name is required.");
    }
    const res = await authJson<{ data: CompanyItem[] }>(
      `/api/dropdown/companies?search=${encodeURIComponent(query)}`
    );
    const results = res.data ?? [];
    if (results.length === 0) {
      throw new Error("Selected company is not in approved companies list.");
    }
    const exact = results.find(
      (item) => item.name.trim().toLowerCase() === query.toLowerCase()
    );
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
          ...Object.fromEntries(
            Object.entries(data.appexA).map(([k, v]) => [k, String(v ?? "")])
          ),
          startDate: data.appexA.startDate
            ? String(data.appexA.startDate).slice(0, 10)
            : "",
          endDate: data.appexA.endDate
            ? String(data.appexA.endDate).slice(0, 10)
            : "",
        });
      })
      .catch(() => undefined);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setTouched(
        Object.keys(form).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {} as Partial<Record<keyof FormShape, boolean>>
        )
      );
      setError("Please fix the highlighted fields and try again.");
      return;
    }
    setFieldErrors({});

    setLoading(true);
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
          {(Object.keys(initialForm) as Array<keyof FormShape>).map((field) => (
            <FormField
              key={field}
              label={FIELD_LABELS[field]}
              error={errorFor(field)}
              hint={FIELD_HINTS[field]}
            >
              {field === "organization" ? (
                <div className="space-y-1">
                  <Input
                    required
                    placeholder={FIELD_PLACEHOLDERS.organization}
                    value={form.organization}
                    onBlur={() => markTouched("organization")}
                    onChange={async (e) => {
                      const nextValue = e.target.value;
                      updateField("organization", nextValue);
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
                            updateField("organization", company.name);
                            setCompanyResults([]);
                          }}
                        >
                          <span className="font-medium text-slate-800 dark:text-slate-100">
                            {company.name}
                          </span>
                          <span className="ml-2 text-slate-500 dark:text-slate-400">
                            {company.industry ?? ""}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : field === "mode" ? (
                <select
                  required
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  value={form.mode}
                  onBlur={() => markTouched("mode")}
                  onChange={(e) => updateField("mode", e.target.value)}
                >
                  <option value="">{FIELD_PLACEHOLDERS.mode}</option>
                  {ALLOWED_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  type={inputTypeFor(field)}
                  required
                  placeholder={FIELD_PLACEHOLDERS[field]}
                  min={field === "numberOfInternship" ? 1 : undefined}
                  max={field === "numberOfInternship" ? 100 : undefined}
                  value={form[field]}
                  onBlur={() => markTouched(field)}
                  onChange={(e) => updateField(field, e.target.value)}
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
