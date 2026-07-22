import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/SignInForm";
import { getSessionUser } from "@/auth/context";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sign in" };

function safeRedirectTarget(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  // Only allow same-origin absolute paths to avoid open redirects.
  if (typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/projects";
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string | string[] }>;
}) {
  const { redirectTo } = await searchParams;
  const target = safeRedirectTarget(redirectTo);

  const user = await getSessionUser();
  if (user) {
    redirect(target);
  }

  return <SignInForm redirectTo={target} />;
}
