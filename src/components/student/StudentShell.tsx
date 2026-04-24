"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AuthSession, clearSession, getSession } from "@/utils/authClient";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import {
  BookOpen,
  Briefcase,
  CalendarCheck2,
  ClipboardCheck,
  ClipboardList,
  FileBadge2,
  FileCheck2,
  FileText,
  LayoutDashboard,
  MessageCircleWarning,
  Network,
} from "lucide-react";

const navItems = [
  { href: "/student", label: "Overview", icon: LayoutDashboard },
  { href: "/student/internships", label: "Internship", icon: Briefcase },
  { href: "/student/appex-a", label: "AppEx A", icon: FileText },
  { href: "/student/appex-b", label: "AppEx B", icon: ClipboardList },
  { href: "/student/appex-b-verification", label: "B Verification", icon: ClipboardCheck },
  { href: "/student/appex-c", label: "AppEx C", icon: BookOpen },
  { href: "/student/weekly-logs", label: "Weekly Logs", icon: CalendarCheck2 },
  { href: "/student/internship-report", label: "Final Report", icon: FileCheck2 },
  { href: "/student/final-result", label: "Final Result", icon: FileBadge2 },
  { href: "/student/complaints", label: "Complaints", icon: MessageCircleWarning },
  { href: "/student/company-requests", label: "Company Requests", icon: Network },
];

type StudentShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export default function StudentShell({ title, description, children }: StudentShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const current = getSession();
    if (!current) {
      router.replace("/login");
      return;
    }
    if (current.user.role !== "STUDENT") {
      router.replace("/dashboard");
      return;
    }
    setSession(current);
  }, [router]);

  const activePath = useMemo(() => pathname || "/student", [pathname]);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      clearSession();
      router.replace("/login");
      setLoading(false);
    }
  }

  if (!session) {
    return <main className="grid min-h-screen place-items-center text-slate-600">Loading...</main>;
  }

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto mb-3 flex max-w-7xl items-center justify-between lg:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <HamburgerMenuIcon className="h-4 w-4" />
          Menu
        </button>
        <ThemeToggle />
      </div>
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[270px_1fr]">
        <motion.aside
          initial={{ x: -16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className={`${menuOpen ? "block" : "hidden"} rounded-2xl border border-white/45 bg-white/85 p-4 shadow-xl backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/85 lg:block`}
        >
          <div className="mb-5 flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
            <Image src="/logo.png" alt="Logo" width={42} height={42} className="rounded-full bg-white" />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Student Portal</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{session.user.name}</p>
            </div>
          </div>

          <div className="mb-4">
            <ThemeToggle />
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = activePath === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? "bg-gradient-to-r from-[#4b2e83] to-[#1f5fa5] !text-white shadow-md [&>svg]:!text-white"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Button
            onClick={handleLogout}
            disabled={loading}
            variant="outline"
            className="mt-5 w-full"
          >
            {loading ? "Logging out..." : "Logout"}
          </Button>
        </motion.aside>

        <motion.section
          initial={{ x: 16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
          className="rounded-2xl border border-white/45 bg-white/85 p-5 shadow-xl backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/85 md:p-6"
        >
          <header className="mb-5 border-b border-slate-200 pb-4">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
            {description ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p> : null}
          </header>
          {children}
        </motion.section>
      </div>
    </main>
  );
}
