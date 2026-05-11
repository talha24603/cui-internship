"use client";

import { FormEvent, useEffect, useState } from "react";
import StudentShell from "@/components/student/StudentShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { authJson } from "@/utils/authClient";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type WeeklyLog = {
  id: string;
  weekNo: number;
  activitiesDone: string;
  skillsLearned: string;
  challenges: string;
  submittedAt?: string;
};

type WeeklyPayload = {
  internship: { status: string };
  weeklyLogs: WeeklyLog[];
  weeklyLogStatus?: { currentWeek: number; totalWeeks: number; hasStarted: boolean; hasEnded: boolean } | null;
};

export default function WeeklyLogsPage() {
  const [data, setData] = useState<WeeklyPayload | null>(null);
  const [weekNo, setWeekNo] = useState("");
  const [activitiesDone, setActivitiesDone] = useState("");
  const [skillsLearned, setSkillsLearned] = useState("");
  const [challenges, setChallenges] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const res = await authJson<WeeklyPayload>("/api/student/weekly-logs");
    setData(res);
    setInitialLoading(false);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Unable to load logs"));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);
    try {
      const res = await authJson<{ message: string }>("/api/student/weekly-logs", {
        method: "POST",
        body: JSON.stringify({ weekNo, activitiesDone, skillsLearned, challenges }),
      });
      setMessage(res.message);
      setWeekNo("");
      setActivitiesDone("");
      setSkillsLearned("");
      setChallenges("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit log");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StudentShell title="Weekly Logs" description="Submit and review your weekly internship progress.">
      <div className="grid gap-5 xl:grid-cols-[1.05fr_1fr]">
        <Card>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Submit Weekly Log</h2>
          {data?.weeklyLogStatus ? (
            <p className="mb-3 text-sm text-slate-600">
              Current week: {data.weeklyLogStatus.currentWeek} / {data.weeklyLogStatus.totalWeeks}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-3">
            <FormField label="Week Number">
              <Input
                type="number"
                min={1}
                required
                value={weekNo}
                onChange={(e) => setWeekNo(e.target.value)}
                placeholder="Week number"
              />
            </FormField>
            <FormField label="Activities Done">
              <Textarea
                required
                value={activitiesDone}
                onChange={(e) => setActivitiesDone(e.target.value)}
                placeholder="Activities done"
                className="min-h-24"
              />
            </FormField>
            <FormField label="Skills Learned">
              <Textarea
                required
                value={skillsLearned}
                onChange={(e) => setSkillsLearned(e.target.value)}
                placeholder="Skills learned"
                className="min-h-24"
              />
            </FormField>
            <FormField label="Challenges">
              <Textarea
                required
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                placeholder="Challenges"
                className="min-h-24"
              />
            </FormField>
            <Button type="submit" loading={submitting} loadingText="Submitting…">
              Submit Log
            </Button>
          </form>
          {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Submitted Logs</h2>
            {data?.internship?.status ? <StatusBadge status={data.internship.status} /> : null}
          </div>
          <div className="space-y-3">
            {initialLoading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : data?.weeklyLogs?.length ? (
              data.weeklyLogs.map((log) => (
                <div key={log.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-900">Week {log.weekNo}</p>
                  <p className="text-xs text-slate-700">Activities: {log.activitiesDone}</p>
                  <p className="text-xs text-slate-700">Skills: {log.skillsLearned}</p>
                  <p className="text-xs text-slate-700">Challenges: {log.challenges}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600">No weekly logs yet.</p>
            )}
          </div>
        </Card>
      </div>
    </StudentShell>
  );
}
