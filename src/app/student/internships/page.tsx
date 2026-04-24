"use client";

import { FormEvent, useEffect, useState } from "react";
import StudentShell from "@/components/student/StudentShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { authJson } from "@/utils/authClient";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BriefcaseBusiness, ListChecks } from "lucide-react";

type InternshipRecord = {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  faculty?: { name: string } | null;
  site?: { name: string; company?: { name: string } | null } | null;
};

type DropdownItem = { id: string; name: string; email?: string };

export default function StudentInternshipsPage() {
  const [internships, setInternships] = useState<InternshipRecord[]>([]);
  const [faculty, setFaculty] = useState<DropdownItem[]>([]);
  const [sites, setSites] = useState<DropdownItem[]>([]);
  const [type, setType] = useState("ONSITE");
  const [facultyId, setFacultyId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    const [internshipsRes, facultyRes, sitesRes] = await Promise.all([
      authJson<{ data: InternshipRecord[] }>("/api/student/internships"),
      authJson<{ data: DropdownItem[] }>("/api/dropdown/faculty"),
      authJson<{ data: DropdownItem[] }>("/api/dropdown/site-supervisors"),
    ]);
    setInternships(internshipsRes.data ?? []);
    setFaculty(facultyRes.data ?? []);
    setSites(sitesRes.data ?? []);
    setInitialLoading(false);
  }

  useEffect(() => {
    loadData().catch((err) => setError(err instanceof Error ? err.message : "Unable to load data"));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await authJson<{ message: string }>("/api/student/create-internship", {
        method: "POST",
        body: JSON.stringify({
          type,
          facultyId: facultyId || undefined,
          siteId: siteId || undefined,
        }),
      });
      setMessage("Internship request submitted successfully.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create internship");
    } finally {
      setLoading(false);
    }
  }

  return (
    <StudentShell
      title="Internship Management"
      description="Create your internship request and track status."
    >
      <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            <span className="inline-flex rounded-md bg-indigo-100 p-1.5 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              <BriefcaseBusiness className="h-4 w-4" />
            </span>
            Create Internship
          </h2>
          <form onSubmit={onSubmit} className="space-y-3">
            <FormField label="Type" hint="Choose internship mode matching your placement.">
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="ONSITE">ONSITE</option>
                <option value="REMOTE">REMOTE</option>
                <option value="FIVERR">FIVERR</option>
              </Select>
            </FormField>

            <FormField label="Preferred Faculty Supervisor">
              <Select value={facultyId} onChange={(e) => setFacultyId(e.target.value)}>
                <option value="">Select faculty (optional)</option>
                {faculty.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Site Supervisor">
              <Select value={siteId} onChange={(e) => setSiteId(e.target.value)}>
                <option value="">Select site supervisor (optional)</option>
                {sites.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
          {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
        </Card>

        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            <span className="inline-flex rounded-md bg-emerald-100 p-1.5 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              <ListChecks className="h-4 w-4" />
            </span>
            Your Requests
          </h2>
          <div className="space-y-3">
            {initialLoading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : internships.length === 0 ? (
              <p className="text-sm text-slate-600">No internship requests yet.</p>
            ) : (
              internships.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.type}</p>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Faculty: {item.faculty?.name ?? "Not assigned"} | Site: {item.site?.name ?? "Not assigned"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </StudentShell>
  );
}
