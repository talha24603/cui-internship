"use client";

import { FormEvent, useEffect, useState } from "react";
import FacultyShell from "@/components/faculty/FacultyShell";
import { Card } from "@/components/student/StudentUi";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { authJson } from "@/utils/authClient";

type FacultyProfile = {
  department: string;
  designation: string;
  phone?: string | null;
  office?: string | null;
  bio?: string | null;
  qualifications?: string | null;
  expertise?: string | null;
  user?: { name: string; email: string } | null;
};

const initialForm = {
  department: "",
  designation: "",
  phone: "",
  office: "",
  bio: "",
  avatarUrl: "",
  qualifications: "",
  expertise: "",
};

export default function FacultyProfilePage() {
  const [form, setForm] = useState(initialForm);
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    authJson<{ profile: FacultyProfile }>("/api/faculty/profile")
      .then((res) => {
        setProfile(res.profile ?? null);
        if (!res.profile) return;
        setForm({
          department: res.profile.department ?? "",
          designation: res.profile.designation ?? "",
          phone: res.profile.phone ?? "",
          office: res.profile.office ?? "",
          bio: res.profile.bio ?? "",
          avatarUrl: "",
          qualifications: res.profile.qualifications ?? "",
          expertise: res.profile.expertise ?? "",
        });
      })
      .catch(() => undefined);
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await authJson<{ message: string; profile: FacultyProfile }>("/api/faculty/profile", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setMessage(res.message);
      setProfile(res.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FacultyShell title="Faculty Profile" description="Keep your profile details up to date.">
      <Card>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <FormField label="Department">
            <Input required value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} />
          </FormField>
          <FormField label="Designation">
            <Input required value={form.designation} onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))} />
          </FormField>
          <FormField label="Phone">
            <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          </FormField>
          <FormField label="Office">
            <Input value={form.office} onChange={(e) => setForm((p) => ({ ...p, office: e.target.value }))} />
          </FormField>
          <FormField label="Qualifications" className="sm:col-span-2">
            <Textarea value={form.qualifications} onChange={(e) => setForm((p) => ({ ...p, qualifications: e.target.value }))} />
          </FormField>
          <FormField label="Expertise" className="sm:col-span-2">
            <Textarea value={form.expertise} onChange={(e) => setForm((p) => ({ ...p, expertise: e.target.value }))} />
          </FormField>
          <FormField label="Bio" className="sm:col-span-2">
            <Textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} />
          </FormField>

          <div className="sm:col-span-2">
            <Button type="submit" loading={loading} loadingText="Saving…">
              Save Profile
            </Button>
          </div>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
        {profile?.user ? (
          <p className="mt-2 text-xs text-slate-500">Signed in as {profile.user.name} ({profile.user.email})</p>
        ) : null}
      </Card>
    </FacultyShell>
  );
}
