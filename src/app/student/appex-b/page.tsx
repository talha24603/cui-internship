"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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

type FormShape = typeof initialForm;
type TextField =
  | "name"
  | "degreeProgram"
  | "email"
  | "semester"
  | "contactNo"
  | "preferredField";
type FormErrors = Partial<Record<keyof FormShape, string>>;

const textFields: TextField[] = [
  "name",
  "degreeProgram",
  "email",
  "semester",
  "contactNo",
  "preferredField",
];

const FIELD_LABELS: Record<TextField, string> = {
  name: "Full name",
  degreeProgram: "Degree program",
  email: "Email",
  semester: "Semester",
  contactNo: "Contact number",
  preferredField: "Preferred field",
};

const FIELD_PLACEHOLDERS: Record<TextField, string> = {
  name: "e.g. Ahmed Khan",
  degreeProgram: "e.g. BS Computer Science",
  email: "e.g. ahmed@example.com",
  semester: "e.g. 6",
  contactNo: "e.g. +92 300 1234567",
  preferredField: "e.g. Web Development",
};

const FIELD_HINTS: Partial<Record<TextField, string>> = {
  email: "Use a valid email like name@example.com",
  semester: "Enter a number between 1 and 12",
  contactNo: "7-20 digits, may include +, -, () and spaces",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d][\d\s\-()]{6,19}$/;
const SEMESTER_REGEX = /^([1-9]|1[0-2])$/;

function inputTypeFor(field: TextField) {
  if (field === "email") return "email";
  if (field === "contactNo") return "tel";
  if (field === "semester") return "number";
  return "text";
}

function validateForm(values: FormShape): FormErrors {
  const errors: FormErrors = {};
  const trim = (s: string) => s.trim();

  if (trim(values.name).length < 2 || trim(values.name).length > 100) {
    errors.name = "Name must be 2-100 characters";
  }
  if (
    trim(values.degreeProgram).length < 2 ||
    trim(values.degreeProgram).length > 100
  ) {
    errors.degreeProgram = "Degree program must be 2-100 characters";
  }
  if (!EMAIL_REGEX.test(trim(values.email))) {
    errors.email = "Enter a valid email address";
  }
  if (!SEMESTER_REGEX.test(trim(values.semester))) {
    errors.semester = "Semester must be a number between 1 and 12";
  }
  if (!PHONE_REGEX.test(trim(values.contactNo))) {
    errors.contactNo = "Enter a valid phone number";
  }
  if (
    trim(values.preferredField).length < 2 ||
    trim(values.preferredField).length > 100
  ) {
    errors.preferredField = "Preferred field must be 2-100 characters";
  }
  if (!values.agreementAccepted) {
    errors.agreementAccepted = "You must accept the agreement";
  }

  return errors;
}

export default function AppexBPage() {
  const [form, setForm] = useState<FormShape>(initialForm);
  const [faculty, setFaculty] = useState<DropdownItem[]>([]);
  const [sites, setSites] = useState<DropdownItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormShape, boolean>>>({});

  const liveErrors = useMemo(() => validateForm(form), [form]);

  function errorFor(field: keyof FormShape) {
    if (fieldErrors[field]) return fieldErrors[field];
    if (touched[field]) return liveErrors[field];
    return undefined;
  }

  function markTouched(field: keyof FormShape) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  useEffect(() => {
    Promise.all([
      authJson<{ data: DropdownItem[] }>("/api/dropdown/faculty"),
      authJson<{ data: DropdownItem[] }>("/api/dropdown/site-supervisors"),
    ])
      .then(([f, s]) => {
        setFaculty(f.data ?? []);
        setSites(s.data ?? []);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unable to load dropdowns")
      );
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

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
    <StudentShell
      title="AppEx B"
      description="Internship assignment details and supervisor preferences."
    >
      <Card>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          {textFields.map((field) => (
            <FormField
              key={field}
              label={FIELD_LABELS[field]}
              error={errorFor(field)}
              hint={FIELD_HINTS[field]}
            >
              <Input
                type={inputTypeFor(field)}
                required
                placeholder={FIELD_PLACEHOLDERS[field]}
                min={field === "semester" ? 1 : undefined}
                max={field === "semester" ? 12 : undefined}
                value={form[field]}
                onBlur={() => markTouched(field)}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [field]: e.target.value }))
                }
              />
            </FormField>
          ))}

          <FormField label="Preferred Faculty">
            <Select
              value={form.facultyId}
              onChange={(e) =>
                setForm((p) => ({ ...p, facultyId: e.target.value }))
              }
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

          <div className="sm:col-span-2 space-y-1">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.agreementAccepted}
                onChange={(e) => {
                  setForm((p) => ({ ...p, agreementAccepted: e.target.checked }));
                  markTouched("agreementAccepted");
                }}
              />
              I confirm the submitted information is correct.
            </label>
            {errorFor("agreementAccepted") ? (
              <p className="text-xs text-rose-600 dark:text-rose-400">
                {errorFor("agreementAccepted")}
              </p>
            ) : null}
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" loading={loading} loadingText="Saving…">
              Save AppEx B
            </Button>
          </div>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </Card>
    </StudentShell>
  );
}
