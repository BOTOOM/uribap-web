import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Route } from "next";

import { InvitationAcceptanceForm } from "@/components/household/InvitationAcceptanceForm";
import { BrandMark, BrandWordmark } from "@/components/ui/BrandMark";
import { auth } from "@/lib/auth/auth";
import { invitationLoginRedirect } from "@/lib/auth/invitation-return-to";
import {
  invitationTokenCookieName,
  isInvitationFlow,
} from "@/lib/auth/invitation-token-cookie";

export const dynamic = "force-dynamic";
export default async function InvitationAcceptPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string | string[];
    flow?: string | string[];
  }>;
}) {
  const { token: searchToken, flow: searchFlow } = await searchParams;
  if (searchToken !== undefined) {
    const token = Array.isArray(searchToken) ? searchToken.join(",") : searchToken;
    redirect(
      `/api/invitations/hold?token=${encodeURIComponent(token)}` as Route,
    );
  }

  const flow = isInvitationFlow(searchFlow) ? searchFlow : null;
  const cookieStore = await cookies();
  const hasHeldInvitation = flow
    ? cookieStore.has(invitationTokenCookieName(flow))
    : false;
  const session = await auth();
  if (!session || session.error === "RefreshAccessTokenError" || !session.user.id) {
    redirect(invitationLoginRedirect(flow) as Route);
  }
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
        <InvitationAcceptanceForm flow={flow} hasHeldInvitation={hasHeldInvitation} />
      </section>
    </main>
  );
}
