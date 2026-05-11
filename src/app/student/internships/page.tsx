"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import StudentShell from "@/components/student/StudentShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { authJson } from "@/utils/authClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ListChecks, Plus } from "lucide-react";

type InternshipRecord = {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  faculty?: { name: string } | null;
  site?: { name: string; company?: { name: string } | null } | null;
};

type FacultyOption = {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
};

type SiteOption = {
  id: string;
  name: string;
  email: string;
  company: { id: string; name: string; industry: string } | null;
};

export default function StudentInternshipsPage() {
  const [internships, setInternships] = useState<InternshipRecord[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  // Create internship form state
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [internshipType, setInternshipType] = useState<string>("");
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [facultyOptions, setFacultyOptions] = useState<FacultyOption[]>([]);
  const [siteOptions, setSiteOptions] = useState<SiteOption[]>([]);

  async function loadData() {
    const internshipsRes = await authJson<{ data: InternshipRecord[] }>("/api/student/internships");
    setInternships(internshipsRes.data ?? []);
    setInitialLoading(false);
  }

  async function loadDropdowns() {
    try {
      const [facultyRes, siteRes] = await Promise.all([
        authJson<{ data: FacultyOption[] }>("/api/dropdown/faculty"),
        authJson<{ data: SiteOption[] }>("/api/dropdown/site-supervisors")
      ]);
      setFacultyOptions(facultyRes.data ?? []);
      setSiteOptions(siteRes.data ?? []);
    } catch (err) {
      console.error("Failed to load dropdowns:", err);
    }
  }

  async function createInternship() {
    if (!internshipType) {
      setCreateError("Please select an internship type");
      return;
    }

    setCreateLoading(true);
    setCreateError("");

    try {
      const body: any = { type: internshipType };
      if (selectedFaculty) body.facultyId = selectedFaculty;
      if (selectedSite) body.siteId = selectedSite;

      await authJson("/api/student/create-internship", {
        method: "POST",
        body: JSON.stringify(body)
      });

      // Reset form
      setInternshipType("");
      setSelectedFaculty("");
      setSelectedSite("");

      // Reload data
      await loadData();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create internship");
    } finally {
      setCreateLoading(false);
    }
  }

  useEffect(() => {
    loadData().catch((err) => setError(err instanceof Error ? err.message : "Unable to load data"));
    loadDropdowns();
  }, []);

  return (
    <StudentShell
      title="Internship Management"
      description="Track your internship record and approval status."
    >
      <div className="grid gap-5 xl:grid-cols-3">
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            <span className="inline-flex rounded-md bg-blue-100 p-1.5 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
              <Plus className="h-4 w-4" />
            </span>
            Create Internship
          </h2>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Start a new internship request by selecting the type and optionally choosing a faculty advisor and site supervisor.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Internship Type *
              </label>
              <select
                value={internshipType}
                onChange={(e) => setInternshipType(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b2e83]/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                required
              >
                <option value="">Select internship type</option>
                <option value="ONSITE">On-site Internship</option>
                <option value="REMOTE">Remote Internship</option>
                <option value="FIVERR">Fiverr/Gig Work</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Faculty Advisor (Optional)
              </label>
              <select
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b2e83]/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">Select faculty advisor</option>
                {facultyOptions.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name} - {faculty.department}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Site Supervisor (Optional)
              </label>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b2e83]/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">Select site supervisor</option>
                {siteOptions.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name} - {site.company?.name || 'No Company'}
                  </option>
                ))}
              </select>
            </div>

            {createError && (
              <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>
            )}

            <Button
              onClick={createInternship}
              disabled={!internshipType}
              loading={createLoading}
              loadingText="Creating…"
              className="w-full"
            >
              Create Internship
            </Button>
          </div>
        </Card>

        {/* <Card>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            <span className="inline-flex rounded-md bg-sky-100 p-1.5 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
              <FileText className="h-4 w-4" />
            </span>
            New Workflow
          </h2>
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
            Internship records are now created automatically when you submit AppEx A.
            Start from AppEx A, then track status here.
          </p>
          <Button asChild>
            <Link href="/student/appex-a">
              Go to AppEx A
            </Link>
          </Button>
          <div className="mt-3 rounded-lg border border-slate-200 p-3 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-400">
            Supervisor assignment is handled later through AppEx B verification.
          </div>
        </Card> */}

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
