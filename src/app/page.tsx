"use client";

import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  const logoRef = useRef<HTMLDivElement>(null);

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

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="relative w-full max-w-3xl rounded-3xl border-white/50 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/80">
          <CardContent className="p-8 text-center sm:p-12">
            <div className="absolute right-5 top-5">
              <ThemeToggle />
            </div>

            <div ref={logoRef} className="mx-auto mb-6 w-fit rounded-full bg-white p-3 shadow-md dark:bg-slate-950">
              <Image src="/logo.png" alt="COMSATS University logo" width={108} height={108} priority />
            </div>

            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 sm:text-4xl">
              CUI Internship Portal
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-400 sm:text-base">
              A modern portal for managing internship workflows for students, faculty, administration,
              and supervisors.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/login">
                <Button size="lg">Login</Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline">
                  Signup
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}