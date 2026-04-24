"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authJson } from "@/utils/authClient";
import { PageEmpty, PageError } from "@/components/shared/page-state";

type AppexB = {
  id: string;
  status: string;
  adminApprovalStatus: string;
  student?: { id: string; name: string; regNo?: string | null; email: string } | null;
  faculty?: { id: string; name: string } | null;
  site?: { id: string; name: string } | null;
  companyName?: string | null;
  internshipRole?: string | null;
};

type AppexBDetail = {
  id: string;
  name?: string | null;
  degreeProgram?: string | null;
  email?: string | null;
  semester?: string | null;
  contactNo?: string | null;
  preferredField?: string | null;
  agreementAccepted?: boolean | null;
  status?: string | null;
  adminApprovalStatus?: string | null;
  facultyVerificationComments?: string | null;
  studentVerificationComments?: string | null;
  companyName?: string | null;
  internshipRole?: string | null;
  facultySupervisorNameDesig?: string | null;
  siteSupervisorNameDesig?: string | null;
  durationWeeks?: number | null;
  startDate?: string | null;
  endDate?: string | null;
};

type FacultySearchItem = {
  id: string;
  name: string | null;
  email?: string | null;
};

type SiteSearchItem = {
  id: string;
  name: string | null;
  email?: string | null;
};

type CompanySearchItem = {
  id: string;
  name: string;
  industry?: string;
};

export default function AdminAppexBPage() {
  const [items, setItems] = useState<AppexB[]>([]);
  const [status, setStatus] = useState("");
  const [approval, setApproval] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selected, setSelected] = useState<AppexB | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<AppexBDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [companyName, setCompanyName] = useState<Record<string, string>>({});
  const [internshipRole, setInternshipRole] = useState<Record<string, string>>({});
  const [facultySupervisorNameDesig, setFacultySupervisorNameDesig] = useState<Record<string, string>>({});
  const [siteSupervisorNameDesig, setSiteSupervisorNameDesig] = useState<Record<string, string>>({});
  const [durationWeeks, setDurationWeeks] = useState<Record<string, string>>({});
  const [startDate, setStartDate] = useState<Record<string, string>>({});
  const [endDate, setEndDate] = useState<Record<string, string>>({});
  const [facultySearchResults, setFacultySearchResults] = useState<Record<string, FacultySearchItem[]>>({});
  const [siteSearchResults, setSiteSearchResults] = useState<Record<string, SiteSearchItem[]>>({});
  const [companySearchResults, setCompanySearchResults] = useState<Record<string, CompanySearchItem[]>>({});
  const [facultyIdByItem, setFacultyIdByItem] = useState<Record<string, string>>({});
  const [siteIdByItem, setSiteIdByItem] = useState<Record<string, string>>({});

  async function searchFaculty(itemId: string, query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      setFacultySearchResults((prev) => ({ ...prev, [itemId]: [] }));
      return;
    }

    const res = await authJson<{ data: FacultySearchItem[] }>(
      `/api/admin/search-faculty?q=${encodeURIComponent(trimmed)}`
    );
    setFacultySearchResults((prev) => ({ ...prev, [itemId]: res.data ?? [] }));
  }

  async function searchSiteSupervisors(itemId: string, query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      setSiteSearchResults((prev) => ({ ...prev, [itemId]: [] }));
      return;
    }

    const res = await authJson<{ data: SiteSearchItem[] }>(
      `/api/admin/search-site-supervisors?q=${encodeURIComponent(trimmed)}`
    );
    setSiteSearchResults((prev) => ({ ...prev, [itemId]: res.data ?? [] }));
  }

  async function searchCompanies(itemId: string, query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      setCompanySearchResults((prev) => ({ ...prev, [itemId]: [] }));
      return;
    }
    const res = await authJson<{ data: CompanySearchItem[] }>(
      `/api/dropdown/companies?search=${encodeURIComponent(trimmed)}`
    );
    setCompanySearchResults((prev) => ({ ...prev, [itemId]: res.data ?? [] }));
  }

  async function resolveFacultyIdBySearch(nameOrDesignation?: string) {
    const query = (nameOrDesignation ?? "").trim();
    if (!query) return undefined;

    const res = await authJson<{ data: FacultySearchItem[] }>(
      `/api/admin/search-faculty?q=${encodeURIComponent(query)}`
    );
    const results = res.data ?? [];
    if (results.length === 0) {
      throw new Error(`No faculty found for "${query}"`);
    }

    const exact = results.find(
      (item) =>
        typeof item.name === "string" &&
        item.name.trim().toLowerCase() === query.toLowerCase()
    );
    if (exact) return exact.id;

    if (results.length > 1) {
      throw new Error(`Multiple faculty matched "${query}". Please enter a more specific name.`);
    }

    return results[0].id;
  }

  async function resolveSiteIdBySearch(nameOrDesignation?: string) {
    const query = (nameOrDesignation ?? "").trim();
    if (!query) return undefined;

    const res = await authJson<{ data: SiteSearchItem[] }>(
      `/api/admin/search-site-supervisors?q=${encodeURIComponent(query)}`
    );
    const results = res.data ?? [];
    if (results.length === 0) {
      throw new Error(`No site supervisor found for "${query}"`);
    }

    const exact = results.find(
      (item) =>
        typeof item.name === "string" &&
        item.name.trim().toLowerCase() === query.toLowerCase()
    );
    if (exact) return exact.id;

    if (results.length > 1) {
      throw new Error(`Multiple site supervisors matched "${query}". Please enter a more specific name.`);
    }

    return results[0].id;
  }

  async function resolveApprovedCompanyName(name?: string) {
    const query = (name ?? "").trim();
    if (!query) return undefined;
    const res = await authJson<{ data: CompanySearchItem[] }>(
      `/api/dropdown/companies?search=${encodeURIComponent(query)}`
    );
    const results = res.data ?? [];
    if (results.length === 0) {
      throw new Error(`No approved company found for "${query}"`);
    }
    const exact = results.find((item) => item.name.trim().toLowerCase() === query.toLowerCase());
    if (exact) return exact.name;
    if (results.length > 1) {
      throw new Error(`Multiple companies matched "${query}". Please select one from search results.`);
    }
    return results[0].name;
  }

  async function load() {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (approval) params.set("adminApprovalStatus", approval);
    const qs = params.toString();
    const res = await authJson<{ data: AppexB[] }>(`/api/admin/appex-b${qs ? `?${qs}` : ""}`);
    setItems(res.data ?? []);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Unable to load AppEx B records"));
  }, [status, approval]);

  async function openDetail(item: AppexB) {
    setSelected(item);
    setSelectedDetail(null);
    setDetailLoading(true);
    try {
      const res = await authJson<{ data: AppexBDetail }>(`/api/admin/appex-b?id=${item.id}`);
      setSelectedDetail(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load AppEx B details");
    } finally {
      setDetailLoading(false);
    }
  }

  async function save(item: AppexB, adminApprovalAction?: "approve" | "reject" | "reset") {
    const detail = selectedDetail;
    const resolvedDurationRaw = durationWeeks[item.id] ?? (detail?.durationWeeks != null ? String(detail.durationWeeks) : "");
    const resolvedStartDate = startDate[item.id] ?? (detail?.startDate ? detail.startDate.slice(0, 10) : "");
    const resolvedEndDate = endDate[item.id] ?? (detail?.endDate ? detail.endDate.slice(0, 10) : "");

    const resolvedFacultySupervisorName =
      facultySupervisorNameDesig[item.id] ?? detail?.facultySupervisorNameDesig ?? undefined;
    const resolvedSiteSupervisorName =
      siteSupervisorNameDesig[item.id] ?? detail?.siteSupervisorNameDesig ?? undefined;
    const resolvedCompanyName = companyName[item.id] ?? detail?.companyName ?? item.companyName ?? undefined;

    try {
      setError("");
      setSuccess("");
      const [approvedCompanyName, resolvedFacultyId, resolvedSiteId] = await Promise.all([
        resolveApprovedCompanyName(resolvedCompanyName),
        facultyIdByItem[item.id] ?? resolveFacultyIdBySearch(resolvedFacultySupervisorName),
        siteIdByItem[item.id] ?? resolveSiteIdBySearch(resolvedSiteSupervisorName),
      ]);

      await authJson<{ message: string }>("/api/admin/appex-b", {
        method: "PATCH",
        body: JSON.stringify({
          studentId: item.student?.id,
          companyName: approvedCompanyName,
          internshipRole: internshipRole[item.id] ?? detail?.internshipRole ?? item.internshipRole ?? undefined,
          facultySupervisorNameDesig: resolvedFacultySupervisorName,
          siteSupervisorNameDesig: resolvedSiteSupervisorName,
          facultyId: resolvedFacultyId,
          siteId: resolvedSiteId,
          durationWeeks: resolvedDurationRaw ? Number(resolvedDurationRaw) : undefined,
          startDate: resolvedStartDate || undefined,
          endDate: resolvedEndDate || undefined,
          adminApprovalAction,
        }),
      });
      await load();
      if (selected) {
        await openDetail(selected);
      }
      const actionLabel =
        adminApprovalAction === "approve"
          ? "approved"
          : adminApprovalAction === "reject"
            ? "rejected"
            : adminApprovalAction === "reset"
              ? "reset"
              : "saved";
      setSuccess(`AppEx B ${actionLabel} successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update AppEx B");
    }
  }

  return (
    <AdminShell title="AppEx B" description="Review assignment details and admin approval status.">
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All status</option>
          <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
          <option value="FACULTY_VERIFIED">FACULTY_VERIFIED</option>
          <option value="STUDENT_VERIFIED">STUDENT_VERIFIED</option>
          <option value="BOTH_VERIFIED">BOTH_VERIFIED</option>
          <option value="CHANGES_REQUESTED">CHANGES_REQUESTED</option>
        </Select>
        <Select value={approval} onChange={(e) => setApproval(e.target.value)}>
          <option value="">All admin approvals</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
        </Select>
      </div>
      {error ? <PageError message={error} className="mb-3" /> : null}
      {success ? (
        <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300">
          {success}
        </p>
      ) : null}

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="cursor-pointer transition hover:shadow-md" onClick={() => openDetail(item)}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {item.student?.name ?? "Unknown"} ({item.student?.regNo ?? "N/A"})
              </h3>
              <div className="flex gap-2">
                <StatusBadge status={item.status} />
                <StatusBadge status={item.adminApprovalStatus} />
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Faculty: {item.faculty?.name ?? "N/A"} | Site: {item.site?.name ?? "N/A"}
            </p>
            <p className="mt-1 text-xs font-medium text-[#2541b2]">Click to view full details</p>
          </Card>
        ))}
        {items.length === 0 ? <PageEmpty message="No AppEx B records found." /> : null}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onClick={() => setSelected(null)}>
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {selected.student?.name ?? "Unknown"} ({selected.student?.regNo ?? "N/A"})
              </h3>
              <div className="flex gap-2">
                <StatusBadge status={selected.status} />
                <StatusBadge status={selected.adminApprovalStatus} />
              </div>
            </div>

            {detailLoading ? <p className="text-sm text-slate-600 dark:text-slate-400">Loading details...</p> : null}

            {!detailLoading && selectedDetail ? (
              <>
                <div className="mb-4 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-800/50">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Student Information</h4>
                  </div>
                  <div className="grid gap-2 p-4 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
                    <p>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Name:</span>{" "}
                      {selected.student?.name ?? selectedDetail.name ?? "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Email:</span>{" "}
                      {selected.student?.email ?? selectedDetail.email ?? "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Registration No:</span>{" "}
                      {selected.student?.regNo ?? "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Student ID:</span>{" "}
                      {selected.student?.id ?? "N/A"}
                    </p>
                  </div>
                </div>

                <div className="mb-4 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-800/50">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Application Details</h4>
                  </div>
                  <div className="grid gap-2 p-4 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
                    <p>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Form ID:</span> {selectedDetail.id}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Status:</span>{" "}
                      {selectedDetail.status ?? selected.status ?? "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Degree Program:</span>{" "}
                      {selectedDetail.degreeProgram ?? "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Semester:</span>{" "}
                      {selectedDetail.semester ?? "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Contact No:</span>{" "}
                      {selectedDetail.contactNo ?? "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Preferred Field:</span>{" "}
                      {selectedDetail.preferredField ?? "N/A"}
                    </p>
                    <p className="sm:col-span-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Agreement Accepted:</span>{" "}
                      {selectedDetail.agreementAccepted ? "Yes" : "No"}
                    </p>
                  </div>
                </div>

                <div className="mb-4 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-800/50">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Suggestions / Rejection Comments</h4>
                  </div>
                  <div className="grid gap-3 p-4 text-sm text-slate-700 dark:text-slate-300">
                    <div>
                      <p className="mb-1 font-semibold text-slate-900 dark:text-slate-100">Faculty Suggestions</p>
                      <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800/50">
                        {selectedDetail.facultyVerificationComments?.trim() || "No suggestions/comments from faculty."}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 font-semibold text-slate-900 dark:text-slate-100">Student Suggestions</p>
                      <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800/50">
                        {selectedDetail.studentVerificationComments?.trim() || "No suggestions/comments from student."}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span>Company Name</span>
                    <div className="space-y-1">
                      <Input
                        placeholder="Type to search approved companies..."
                        value={companyName[selected.id] ?? selectedDetail.companyName ?? selected.companyName ?? ""}
                        onChange={async (e) => {
                          const nextValue = e.target.value;
                          setCompanyName((prev) => ({ ...prev, [selected.id]: nextValue }));
                          await searchCompanies(selected.id, nextValue);
                        }}
                      />
                      {(companySearchResults[selected.id]?.length ?? 0) > 0 ? (
                        <div className="max-h-36 overflow-auto rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                          {(companySearchResults[selected.id] ?? []).slice(0, 8).map((companyItem) => (
                            <button
                              key={companyItem.id}
                              type="button"
                              className="block w-full border-b border-slate-100 px-3 py-2 text-left text-xs hover:bg-slate-50 last:border-b-0 dark:border-slate-800 dark:hover:bg-slate-800"
                              onClick={() => {
                                setCompanyName((prev) => ({
                                  ...prev,
                                  [selected.id]: companyItem.name,
                                }));
                                setCompanySearchResults((prev) => ({ ...prev, [selected.id]: [] }));
                              }}
                            >
                              <span className="font-medium text-slate-800 dark:text-slate-100">{companyItem.name}</span>
                              <span className="ml-2 text-slate-500 dark:text-slate-400">{companyItem.industry ?? ""}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </label>
                  <label className="space-y-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span>Internship Role</span>
                    <Input
                      placeholder="Enter internship role"
                      value={internshipRole[selected.id] ?? selectedDetail.internshipRole ?? selected.internshipRole ?? ""}
                      onChange={(e) => setInternshipRole((prev) => ({ ...prev, [selected.id]: e.target.value }))}
                    />
                  </label>
                  <label className="space-y-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span>Faculty Supervisor (Name / Designation)</span>
                    <div className="space-y-1">
                      <Input
                        placeholder="Type to search faculty..."
                        value={facultySupervisorNameDesig[selected.id] ?? selectedDetail.facultySupervisorNameDesig ?? ""}
                        onChange={async (e) => {
                          const nextValue = e.target.value;
                          setFacultySupervisorNameDesig((prev) => ({ ...prev, [selected.id]: nextValue }));
                          setFacultyIdByItem((prev) => ({ ...prev, [selected.id]: "" }));
                          await searchFaculty(selected.id, nextValue);
                        }}
                      />
                      {(facultySearchResults[selected.id]?.length ?? 0) > 0 ? (
                        <div className="max-h-36 overflow-auto rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                          {(facultySearchResults[selected.id] ?? []).slice(0, 8).map((facultyItem) => (
                            <button
                              key={facultyItem.id}
                              type="button"
                              className="block w-full border-b border-slate-100 px-3 py-2 text-left text-xs hover:bg-slate-50 last:border-b-0 dark:border-slate-800 dark:hover:bg-slate-800"
                              onClick={() => {
                                setFacultySupervisorNameDesig((prev) => ({
                                  ...prev,
                                  [selected.id]: facultyItem.name ?? "",
                                }));
                                setFacultyIdByItem((prev) => ({ ...prev, [selected.id]: facultyItem.id }));
                                setFacultySearchResults((prev) => ({ ...prev, [selected.id]: [] }));
                              }}
                            >
                              <span className="font-medium text-slate-800 dark:text-slate-100">
                                {facultyItem.name ?? "Unnamed faculty"}
                              </span>
                              <span className="ml-2 text-slate-500 dark:text-slate-400">{facultyItem.email ?? ""}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </label>
                  <label className="space-y-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span>Site Supervisor (Name / Designation)</span>
                    <div className="space-y-1">
                      <Input
                        placeholder="Type to search site supervisors..."
                        value={siteSupervisorNameDesig[selected.id] ?? selectedDetail.siteSupervisorNameDesig ?? ""}
                        onChange={async (e) => {
                          const nextValue = e.target.value;
                          setSiteSupervisorNameDesig((prev) => ({ ...prev, [selected.id]: nextValue }));
                          setSiteIdByItem((prev) => ({ ...prev, [selected.id]: "" }));
                          await searchSiteSupervisors(selected.id, nextValue);
                        }}
                      />
                      {(siteSearchResults[selected.id]?.length ?? 0) > 0 ? (
                        <div className="max-h-36 overflow-auto rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                          {(siteSearchResults[selected.id] ?? []).slice(0, 8).map((siteItem) => (
                            <button
                              key={siteItem.id}
                              type="button"
                              className="block w-full border-b border-slate-100 px-3 py-2 text-left text-xs hover:bg-slate-50 last:border-b-0 dark:border-slate-800 dark:hover:bg-slate-800"
                              onClick={() => {
                                setSiteSupervisorNameDesig((prev) => ({
                                  ...prev,
                                  [selected.id]: siteItem.name ?? "",
                                }));
                                setSiteIdByItem((prev) => ({ ...prev, [selected.id]: siteItem.id }));
                                setSiteSearchResults((prev) => ({ ...prev, [selected.id]: [] }));
                              }}
                            >
                              <span className="font-medium text-slate-800 dark:text-slate-100">
                                {siteItem.name ?? "Unnamed site supervisor"}
                              </span>
                              <span className="ml-2 text-slate-500 dark:text-slate-400">{siteItem.email ?? ""}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </label>
                  <label className="space-y-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span>Duration (Weeks)</span>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Enter duration in weeks"
                      value={durationWeeks[selected.id] ?? (selectedDetail.durationWeeks != null ? String(selectedDetail.durationWeeks) : "")}
                      onChange={(e) => setDurationWeeks((prev) => ({ ...prev, [selected.id]: e.target.value }))}
                    />
                  </label>
                  <label className="space-y-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span>Start Date</span>
                    <Input
                      type="date"
                      value={startDate[selected.id] ?? (selectedDetail.startDate ? selectedDetail.startDate.slice(0, 10) : "")}
                      onChange={(e) => setStartDate((prev) => ({ ...prev, [selected.id]: e.target.value }))}
                    />
                  </label>
                  <label className="space-y-1 text-xs font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">
                    <span>End Date</span>
                    <Input
                      type="date"
                      value={endDate[selected.id] ?? (selectedDetail.endDate ? selectedDetail.endDate.slice(0, 10) : "")}
                      onChange={(e) => setEndDate((prev) => ({ ...prev, [selected.id]: e.target.value }))}
                    />
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => save(selected)}>Save Details</Button>
                  <Button size="sm" onClick={() => save(selected, "approve")}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => save(selected, "reject")}>Reject</Button>
                  <Button size="sm" variant="outline" onClick={() => save(selected, "reset")}>Reset</Button>
                  <Button size="sm" variant="outline" onClick={() => setSelected(null)}>Close</Button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
