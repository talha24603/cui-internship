"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { AuthField, SubmitButton } from "@/components/auth/AuthFields";
import { postJson } from "@/utils/authClient";

type RegisterResponse = {
  message: string;
  user: { id: string; name: string; email: string };
};

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
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
      const result = await postJson<RegisterResponse>("/api/auth/register", {
        name,
        regNo,
        email,
        password,
      });

      if (!result.ok) {
        const err = result.data as { message?: string; error?: string };
        throw new Error(err.message || err.error || "Unable to register");
      }

      const payload = result.data as RegisterResponse;
      setMessage(payload.message || "Registration successful. Please verify your email.");

      setTimeout(() => {
        router.push("/login");
      }, 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create Account"
      subtitle="Student registration for the internship portal."
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkHref="/login"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          id="name"
          label="Full Name"
          type="text"
          required
          autoComplete="name"
          placeholder="Talha Ahmed"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <AuthField
          id="regNo"
          label="Registration Number"
          type="text"
          required
          placeholder="FA21-BCS-123"
          value={regNo}
          onChange={(e) => setRegNo(e.target.value)}
        />
        <AuthField
          id="email"
          label="University Email"
          type="email"
          required
          autoComplete="email"
          placeholder="fa21-bcs-123@cuiatd.edu.pk"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <SubmitButton loading={loading} label="Create Account" loadingLabel="Creating account..." />

        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </form>
    </AuthShell>
  );
}
