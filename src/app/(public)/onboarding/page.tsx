import { redirect } from "next/navigation";
import type { Route } from "next";

import { OnboardingForm } from "@/components/household/OnboardingForm";
import { BrandMark, BrandWordmark } from "@/components/ui/BrandMark";
import type { components } from "@/lib/api/generated/schema";
import { ApiRequestError, serverApiFetch } from "@/lib/api/server-client";
import { auth } from "@/lib/auth/auth";


export const dynamic = "force-dynamic";
export default async function OnboardingPage() {
  const session = await auth();
  if (!session) redirect("/login?returnTo=/onboarding" as Route);
  let currentUser: components["schemas"]["CurrentUserResponse"];
  try {
    currentUser = await serverApiFetch<components["schemas"]["CurrentUserResponse"]>("/me");
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      redirect("/login?returnTo=/onboarding" as Route);
    }
    throw error;
  }
  if (currentUser.memberships.some((membership) => membership.status === "active")) {
    redirect("/plan" as Route);
  }
  return (
    <main className="auth-shell">
      <section aria-labelledby="onboarding-title" className="card auth-card">
        <div className="brand auth-logo">
          <BrandMark />
          <BrandWordmark />
        </div>
        <div aria-hidden="true" className="steps">
          <span className="step active" />
          <span className="step" />
          <span className="step" />
          <span className="step" />
        </div>
        <h1 id="onboarding-title">Empecemos por el hogar.</h1>
        <p className="muted">
          Define el nombre, idioma y zona horaria que usarán las decisiones compartidas.
        </p>
        <OnboardingForm />
      </section>
    </main>
  );
}
