"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { AuthField, SubmitButton } from "@/components/auth/AuthFields";
import { postJson } from "@/utils/authClient";

type ResetPasswordResponse = {
  message: string;
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordFallback() {
  return (
    <AuthShell
      title="Reset Password"
      subtitle="Set a new password for your account."
      footerText="Back to"
      footerLinkText="Login"
      footerLinkHref="/login"
    >
      <p className="text-sm text-slate-600 dark:text-slate-400">Loading reset link...</p>
    </AuthShell>
  );
}

function ResetPasswordContent() {
  const params = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (!token) throw new Error("Missing reset token in URL");
      if (password.length < 6) throw new Error("Password must be at least 6 characters");
      if (password !== confirmPassword) throw new Error("Passwords do not match");

      const result = await postJson<ResetPasswordResponse>("/api/auth/reset-password", {
        token,
        password,
      });

      if (!result.ok) {
        const err = result.data as { message?: string; error?: string };
        throw new Error(err.message || err.error || "Unable to reset password");
      }

      const payload = result.data as ResetPasswordResponse;
      setMessage(payload.message || "Password reset successful. Please login.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset Password"
      subtitle="Set a new password for your account."
      footerText="Back to"
      footerLinkText="Login"
      footerLinkHref="/login"
    >
      {!token ? (
        <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <p>Reset link is invalid or missing token.</p>
          <Link href="/forgot-password" className="font-medium text-[#2541b2] hover:underline">
            Request a new reset link
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField
            id="password"
            label="New Password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <AuthField
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <SubmitButton loading={loading} label="Update Password" loadingLabel="Updating..." />

          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        </form>
      )}
    </AuthShell>
  );
}
