"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { AuthField, SubmitButton } from "@/components/auth/AuthFields";
import { postJson, saveSession } from "@/utils/authClient";

type LoginResponse = {
  message: string;
  accessToken: string;
  user: { id: string; name: string; email: string; role: string };
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await postJson<LoginResponse>("/api/auth/login", { email, password });
      if (!result.ok) {
        const err = result.data as { message?: string; error?: string };
        throw new Error(err.message || err.error || "Unable to login");
      }

      const payload = result.data as LoginResponse;
      saveSession({ accessToken: payload.accessToken, user: payload.user });
      setMessage("Login successful. Redirecting...");
      if (payload.user.role === "STUDENT") {
        router.push("/student");
      } else if (payload.user.role === "FACULTY") {
        router.push("/faculty");
      } else if (payload.user.role === "ADMIN") {
        router.push("/admin");
      } else if (payload.user.role === "SITE_SUPERVISOR") {
        router.push("/site");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Sign in to access your internship portal."
      footerText="Don't have an account?"
      footerLinkText="Create account"
      footerLinkHref="/signup"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          id="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex justify-end text-sm">
          <Link href="/forgot-password" className="font-medium text-[#2541b2] hover:underline">
            Forgot password?
          </Link>
        </div>

        <SubmitButton loading={loading} label="Login" loadingLabel="Signing in..." />

        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </form>
    </AuthShell>
  );
}
