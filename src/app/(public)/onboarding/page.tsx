import { redirect } from "next/navigation";
import type { Route } from "next";

import { auth } from "@/lib/auth/auth";
import { OnboardingForm } from "@/components/household/OnboardingForm";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session) redirect("/login?returnTo=/onboarding" as Route);
  if (session.user.memberships.length > 0) redirect("/plan" as Route);
  return (
    <main className="foundation-shell">
      <section className="foundation-hero" aria-labelledby="onboarding-title">
        <p className="eyebrow">Uribap · primer hogar</p>
        <h1 id="onboarding-title">Empecemos por el hogar.</h1>
        <p className="lede">Define el nombre, idioma y zona horaria que usarán las decisiones compartidas.</p>
        <OnboardingForm />
      </section>
    </main>
  );
}
