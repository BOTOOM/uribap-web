import { redirect } from "next/navigation";
import type { Route } from "next";

import { auth } from "@/lib/auth/auth";
import { InvitationAcceptanceForm } from "@/components/household/InvitationAcceptanceForm";

export default async function InvitationAcceptPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const session = await auth();
  if (!session) redirect("/login?returnTo=/invitations/accept" as Route);
  const { token } = await searchParams;
  return (
    <main className="foundation-shell">
      <section className="foundation-hero" aria-labelledby="invitation-title">
        <p className="eyebrow">Uribap · invitación</p>
        <h1 id="invitation-title">Únete al hogar compartido.</h1>
        <p className="lede">La invitación se valida en el servidor y solo puede usarse una vez.</p>
        <InvitationAcceptanceForm initialToken={token ?? ""} />
      </section>
    </main>
  );
}
