"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { clearSession, getSession } from "@/utils/authClient";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null);

  useEffect(() => {
    const storedSession = getSession();
    setSession(storedSession);

    if (!storedSession) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      clearSession();
      setSession(null);
      router.replace("/login");
      setLoading(false);
    }
  }

  if (!ready || !session) {
    return <main className="grid min-h-screen place-items-center text-slate-600">Loading...</main>;
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mx-auto max-w-5xl space-y-8"
      >
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/85">
          <div className="flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="COMSATS University logo"
              width={56}
              height={56}
              className="rounded-full bg-white"
            />
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">CUI Internship Portal</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Authenticated session is active.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={handleLogout} loading={loading} loadingText="Logging out…">
              Logout
            </Button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <Card><CardContent>
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">Name</h2>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{session.user.name}</p>
          </CardContent></Card>
          <Card><CardContent>
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">Email</h2>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{session.user.email}</p>
          </CardContent></Card>
          <Card><CardContent>
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">Role</h2>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{session.user.role}</p>
          </CardContent></Card>
          <Card><CardContent>
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">Next step</h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Connect this page to role-specific dashboards (`/student`, `/faculty`, `/admin`,
              `/site`) as you build them.
            </p>
          </CardContent></Card>
        </section>

        <div className="text-sm text-slate-700 dark:text-slate-300">
          Need to re-open auth pages?{" "}
          <Link className="font-medium text-[#2541b2] hover:underline" href="/login">
            Login
          </Link>
          {" · "}
          <Link className="font-medium text-[#2541b2] hover:underline" href="/signup">
            Signup
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
