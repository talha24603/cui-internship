"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type InternshipItem = {
  id: string;
  status: string;
  student?: { name?: string | null; regNo?: string | null; email?: string | null } | null;
};

type SummaryResponse = {
  data: {
    marks: {
      facultyMarks: number | null;
      siteMarks: number | null;
      officeMarks: number | null;
      totalPreview: number;
      statusPreview: string;
      maximumMarks: { faculty: number; site: number; office: number; total: number };
    };
    finalization: {
      isFinalizedByFaculty: boolean;
      finalizedAt: string | null;
      finalizedById: string | null;
    };
  };
};

export default function FacultyFinalizationPage() {
  const [token, setToken] = useState("");
  const [internships, setInternships] = useState<InternshipItem[]>([]);
  const [selectedInternshipId, setSelectedInternshipId] = useState("");
  const [facultyMarksInput, setFacultyMarksInput] = useState("");
  const [siteMarksInput, setSiteMarksInput] = useState("");
  const [officeMarksInput, setOfficeMarksInput] = useState("");
  const [summary, setSummary] = useState<SummaryResponse["data"] | null>(null);
  const [status, setStatus] = useState("Provide token to start.");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("accessToken");
    if (saved) {
      setToken(saved);
      setStatus("Token loaded from localStorage.");
    }
  }, []);

  const canLoad = useMemo(
    () => token.trim().length > 0 && selectedInternshipId.trim().length > 0,
    [token, selectedInternshipId],
  );

  async function loadInternships() {
    if (!token.trim()) {
      setStatus("Enter an access token first.");
      return;
    }

    setLoading(true);
    setStatus("Loading assigned internships...");
    try {
      const response = await fetch("/api/faculty/internships", {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
        },
      });

      const payload = await response.json();
      if (!response.ok) {
        setStatus(payload.error ?? "Could not load internships.");
        setLoading(false);
        return;
      }

      const list = (payload.data ?? []) as InternshipItem[];
      setInternships(list);
      if (list.length > 0 && !selectedInternshipId) {
        setSelectedInternshipId(list[0].id);
      }
      setStatus("Internships loaded.");
    } catch {
      setStatus("Network error while loading internships.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSummary() {
    if (!canLoad) {
      setStatus("Select internship and token first.");
      return;
    }

    setLoading(true);
    setStatus("Loading marks summary...");
    try {
      const response = await fetch(
        `/api/faculty/finalization?internshipId=${encodeURIComponent(selectedInternshipId)}`,
        {
          headers: {
            Authorization: `Bearer ${token.trim()}`,
          },
        },
      );
      const payload = (await response.json()) as SummaryResponse & { error?: string };
      if (!response.ok) {
        setStatus(payload.error ?? "Could not load summary.");
        setLoading(false);
        return;
      }

      setSummary(payload.data);
      if (payload.data.marks.facultyMarks != null) {
        setFacultyMarksInput(String(payload.data.marks.facultyMarks));
      }
      if (payload.data.marks.siteMarks != null) {
        setSiteMarksInput(String(payload.data.marks.siteMarks));
      }
      if (payload.data.marks.officeMarks != null) {
        setOfficeMarksInput(String(payload.data.marks.officeMarks));
      }
      setStatus("Marks summary loaded.");
    } catch {
      setStatus("Network error while loading summary.");
    } finally {
      setLoading(false);
    }
  }

  async function finalizeResult(event: FormEvent) {
    event.preventDefault();
    if (!canLoad) {
      setStatus("Select internship and token first.");
      return;
    }

    const parsedFacultyMarks = Number(facultyMarksInput);
    if (!Number.isInteger(parsedFacultyMarks) || parsedFacultyMarks < 0 || parsedFacultyMarks > 40) {
      setStatus("Faculty marks must be an integer from 0 to 40.");
      return;
    }

    const parsedSiteMarks = Number(siteMarksInput);
    if (!Number.isInteger(parsedSiteMarks) || parsedSiteMarks < 0 || parsedSiteMarks > 40) {
      setStatus("Site supervisor marks must be an integer from 0 to 40.");
      return;
    }

    const parsedOfficeMarks = Number(officeMarksInput);
    if (!Number.isInteger(parsedOfficeMarks) || parsedOfficeMarks < 0 || parsedOfficeMarks > 20) {
      setStatus("Admin/office marks must be an integer from 0 to 20.");
      return;
    }

    setLoading(true);
    setStatus("Submitting final number...");
    try {
      const response = await fetch("/api/faculty/finalization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.trim()}`,
        },
        body: JSON.stringify({
          internshipId: selectedInternshipId,
          facultyMarks: parsedFacultyMarks,
          siteMarks: parsedSiteMarks,
          officeMarks: parsedOfficeMarks,
        }),
      });

      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setStatus(payload.error ?? "Finalization failed.");
        setLoading(false);
        return;
      }

      setStatus(payload.message ?? "Result finalized successfully.");
      await loadSummary();
    } catch {
      setStatus("Network error while finalizing result.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Faculty Supervisor Final Result</h1>
      <p style={{ marginBottom: 20 }}>
        Review all marks and submit final faculty, site supervisor, and admin/office numbers.
        Student final result remains hidden until this step is completed.
      </p>

      <section style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        <label>
          Access Token (Bearer token)
          <input
            style={{ width: "100%", padding: 8, marginTop: 6 }}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste access token"
          />
        </label>
        <button type="button" onClick={loadInternships} disabled={loading}>
          Load Assigned Internships
        </button>

        <label>
          Internship
          <select
            style={{ width: "100%", padding: 8, marginTop: 6 }}
            value={selectedInternshipId}
            onChange={(e) => setSelectedInternshipId(e.target.value)}
          >
            <option value="">Select internship</option>
            {internships.map((item) => (
              <option key={item.id} value={item.id}>
                {item.student?.name ?? "Unnamed Student"} ({item.student?.regNo ?? "No RegNo"}) -{" "}
                {item.status}
              </option>
            ))}
          </select>
        </label>

        <button type="button" onClick={loadSummary} disabled={loading || !canLoad}>
          Show All Marks
        </button>
      </section>

      {summary && (
        <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <h2 style={{ marginBottom: 10 }}>Marks Overview</h2>
          <p>Faculty: {summary.marks.facultyMarks ?? "Not entered"} / 40</p>
          <p>Site: {summary.marks.siteMarks ?? "Not entered"} / 40</p>
          <p>Office: {summary.marks.officeMarks ?? "Not entered"} / 20</p>
          <p>Total Preview: {summary.marks.totalPreview} / 100</p>
          <p>Status Preview: {summary.marks.statusPreview}</p>
          <p>
            Finalization State:{" "}
            {summary.finalization.isFinalizedByFaculty ? "Finalized" : "Draft (Locked for student)"}
          </p>
        </section>
      )}

      <form onSubmit={finalizeResult} style={{ display: "grid", gap: 12 }}>
        <h2>Submit Final Numbers</h2>
        <label>
          Faculty Final Number (0-40)
          <input
            type="number"
            min={0}
            max={40}
            step={1}
            value={facultyMarksInput}
            onChange={(e) => setFacultyMarksInput(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>
        <label>
          Site Supervisor Final Number (0-40)
          <input
            type="number"
            min={0}
            max={40}
            step={1}
            value={siteMarksInput}
            onChange={(e) => setSiteMarksInput(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>
        <label>
          Admin/Office Final Number (0-20)
          <input
            type="number"
            min={0}
            max={20}
            step={1}
            value={officeMarksInput}
            onChange={(e) => setOfficeMarksInput(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>
        <button type="submit" disabled={loading || !canLoad}>
          Finalize Result
        </button>
      </form>

      <p style={{ marginTop: 20 }}>{status}</p>
    </main>
  );
}
