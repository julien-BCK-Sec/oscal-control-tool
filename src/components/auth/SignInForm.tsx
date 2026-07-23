"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signIn } from "@/auth/client";
import { Brand } from "@/components/design-system/brand/Brand";
import { Button } from "@/components/design-system/button/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/design-system/card/Card";

/**
 * Minimal email/password sign-in (ADR-015). Public self-registration is
 * disabled; accounts are created by invitation only. On success the browser is
 * redirected to the originally requested route.
 */
export function SignInForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const result = await signIn.email({ email, password });
    setPending(false);
    if (result.error) {
      setError(
        result.error.status === 403
          ? "Please verify your email address before signing in."
          : "Sign in failed. Check your email and password.",
      );
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-6 px-4 py-16">
      <Brand variant="lockup" appearance="auto" size="sm" priority />
      <Card prominent aria-labelledby="sign-in-heading">
        <CardHeader>
          <CardTitle id="sign-in-heading">Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
            <div>
              <label htmlFor="sign-in-email" className="label">
                Email
              </label>
              <input
                id="sign-in-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field mt-1.5"
              />
            </div>
            <div>
              <label htmlFor="sign-in-password" className="label">
                Password
              </label>
              <input
                id="sign-in-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field mt-1.5"
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            ) : null}
            <Button
              type="submit"
              variant="primary"
              disabled={pending || email.trim() === "" || password === ""}
            >
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-text-secondary">
            Access is invite-only. Ask an organization administrator for an
            invitation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
