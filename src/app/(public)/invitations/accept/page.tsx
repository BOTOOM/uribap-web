import { redirect } from "next/navigation";
import type { Route } from "next";

import { InvitationAcceptanceForm } from "@/components/household/InvitationAcceptanceForm";
import { BrandMark, BrandWordmark } from "@/components/ui/BrandMark";
import { auth } from "@/lib/auth/auth";


export const dynamic = "force-dynamic";
export default async function InvitationAcceptPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await auth();
  if (!session || session.error === "RefreshAccessTokenError" || !session.user.id) {
    redirect("/login?returnTo=/invitations/accept" as Route);
  }
  const { token } = await searchParams;
  return (
    <main className="auth-shell">
      <section aria-labelledby="invitation-title" className="card auth-card">
        <div className="brand auth-logo">
          <BrandMark />
          <BrandWordmark />
        </div>
        <h1 id="invitation-title">Únete al hogar compartido.</h1>
        <p className="muted">
          La invitación se valida en el servidor y solo puede usarse una vez.
        </p>
        <InvitationAcceptanceForm initialToken={token ?? ""} />
      </section>
    </main>
  );
}
