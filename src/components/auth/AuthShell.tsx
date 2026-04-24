"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import ThemeToggle from "@/components/theme-toggle";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
};

export default function AuthShell({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-5xl"
      >
        <Card className="relative overflow-hidden rounded-3xl border-white/50 bg-white/80 dark:border-slate-800/70 dark:bg-slate-900/85">
          <div className="pointer-events-none absolute -left-20 top-10 h-40 w-40 rounded-full bg-[#4b2e83]/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-8 h-40 w-40 rounded-full bg-[#1f5fa5]/20 blur-3xl" />
          <div className="absolute right-5 top-5 z-20">
            <ThemeToggle />
          </div>
          <div className="grid min-h-[680px] grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
            <section className="relative hidden bg-gradient-to-br from-[#4b2e83] via-[#3f3d9c] to-[#1f5fa5] p-10 text-white lg:flex lg:flex-col lg:justify-between">
              <div className="space-y-5">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs tracking-wide">
                  <Sparkles className="h-3.5 w-3.5" />
                  COMSATS Internship Portal
                </span>
                <h2 className="max-w-sm text-4xl font-semibold leading-tight">
                  Smart internship management for every role.
                </h2>
                <p className="max-w-md text-sm text-white/90">
                  Secure access for students, faculty, administration, and supervisors in one
                  integrated platform.
                </p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                <p className="text-sm text-white/90">Built for a smooth and modern experience.</p>
              </div>
            </section>

            <section className="flex items-center justify-center p-6 sm:p-10">
              <div className="w-full max-w-md space-y-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <Image
                    src="/logo.png"
                    alt="COMSATS University logo"
                    width={88}
                    height={88}
                    className="h-22 w-22 rounded-full bg-white object-contain shadow-md"
                    priority
                  />
                  <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
                  </div>
                </div>

                {children}

                <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                  {footerText}{" "}
                  <Link href={footerLinkHref} className="font-medium text-[#2541b2] hover:underline">
                    {footerLinkText}
                  </Link>
                </p>
              </div>
            </section>
          </div>
        </Card>
      </motion.div>
    </main>
  );
}
