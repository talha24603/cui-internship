"use client";

import AuthShell from "@/components/auth/AuthShell";
import { AuthField, SubmitButton } from "@/components/auth/AuthFields";
import { postJson } from "@/utils/authClient";
import { FormEvent, useState } from "react";

type ForgotPasswordResponse = {
  message: string;
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await postJson<ForgotPasswordResponse>("/api/auth/forgot-password", { email });
      if (!result.ok) {
        const err = result.data as { message?: string; error?: string };
        throw new Error(err.message || err.error || "Unable to send reset link");
      }

      const payload = result.data as ForgotPasswordResponse;
      setMessage(payload.message || "If this email exists, a reset link was sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Forgot Password"
      subtitle="Enter your email to receive a password reset link."
      footerText="Remember your password?"
      footerLinkText="Back to login"
      footerLinkHref="/login"
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

        <SubmitButton loading={loading} label="Send Reset Link" loadingLabel="Sending..." />

        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </form>
    </AuthShell>
  );
}
