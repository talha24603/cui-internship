"use client";

import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Pin, ShieldCheck, Users, Workflow } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type AuthSession, getSession } from "@/utils/authClient";

type Announcement = {
  id: string;
  title?: string | null;
  message: string;
  link?: string | null;
  pinned: boolean;
  createdAt: string;
};

export default function HomePage() {
  const logoRef = useRef<HTMLDivElement>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    if (!logoRef.current) return;
    const animation = gsap.to(logoRef.current, {
      y: -8,
      duration: 1.8,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
    return () => {
      animation.kill();
    };
  }, []);

  useEffect(() => {
    fetch("/api/announcements", { method: "GET" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Unable to load announcements");
        return (await res.json()) as { data?: Announcement[] };
      })
      .then((payload) => setAnnouncements((payload.data ?? []).slice(0, 4)))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoadingAnnouncements(false));
  }, []);

  useEffect(() => {
    setSession(getSession());
    setSessionChecked(true);
  }, []);

  const dashboardHref =
    session?.user.role === "STUDENT"
      ? "/student"
      : session?.user.role === "FACULTY"
      ? "/faculty"
      : session?.user.role === "ADMIN"
      ? "/admin"
      : session?.user.role === "SITE_SUPERVISOR"
      ? "/site"
      : "/dashboard";

  return (
    <main className="min-h-screen px-4 py-10 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-6xl space-y-6"
      >
        <Card className="relative rounded-3xl border-white/50 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/80">
          <CardContent className="p-8 sm:p-12">
            <div className="absolute right-5 top-5 z-10">
              <ThemeToggle />
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div ref={logoRef} className="mb-5 w-fit rounded-full bg-white p-3 shadow-md dark:bg-slate-950">
                  <Image src="/logo.png" alt="COMSATS University logo" width={96} height={96} priority />
                </div>
                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 sm:text-4xl">
                  CUI Internship Portal
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                  Centralized internship platform for students, faculty, admin, and site supervisors with role-based
                  workflows, approvals, evaluations, and finalization in one place.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  {!sessionChecked ? null : session ? (
                    <Link href={dashboardHref}>
                      <Button size="lg">Go to Dashboard</Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/login">
                        <Button size="lg">Login</Button>
                      </Link>
                      <Link href="/signup">
                        <Button size="lg" variant="outline">
                          Signup
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 mt-10">
                <FeatureTile
                  icon={<Workflow className="h-4 w-4" />}
                  title="Structured Workflow"
                  text="From AppEx forms to final results with clean status tracking."
                />
                <FeatureTile
                  icon={<ShieldCheck className="h-4 w-4" />}
                  title="Role-Based Access"
                  text="Separate secure experiences for every stakeholder role."
                />
                <FeatureTile
                  icon={<Users className="h-4 w-4" />}
                  title="Cross-Team Visibility"
                  text="Student, faculty, admin, and site supervisor coordination."
                />
                <FeatureTile
                  icon={<Bell className="h-4 w-4" />}
                  title="Public Announcements"
                  text="Latest updates visible on home page for all visitors."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/50 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/80">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#2541b2]" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Public Announcements</h2>
            </div>

            <div className="space-y-3">
              {loadingAnnouncements ? (
                <>
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </>
              ) : announcements.length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                  No announcements available yet.
                </p>
              ) : (
                announcements.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    <div className="mb-1 flex items-center gap-2">
                      {item.pinned ? <Pin className="h-3.5 w-3.5 text-amber-500" /> : null}
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.title || "Announcement"}
                      </p>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{item.message}</p>
                    {item.link ? (
                      <a href={item.link} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-[#2541b2] hover:underline">
                        {item.link}
                      </a>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}

function FeatureTile({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/80">
      <div className="mb-2 inline-flex rounded-md bg-indigo-100 p-1.5 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
        {icon}
      </div>
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{text}</p>
    </div>
  );
}