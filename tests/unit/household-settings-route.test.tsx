import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { serverApiFetch } = vi.hoisted(() => ({ serverApiFetch: vi.fn() }));

vi.mock("@/lib/api/server-client", () => ({ serverApiFetch }));
vi.mock("@/components/household/ActivityFeed", () => ({ ActivityFeed: () => null }));
vi.mock("@/components/household/InvitationForm", () => ({ InvitationForm: () => null }));
vi.mock("@/components/household/MemberManagement", () => ({ MemberManagement: () => null }));
vi.mock("@/components/household/PendingInvitations", () => ({
  PendingInvitations: ({ items }: { items: unknown[] }) => (
    <section data-testid="pending-invitations">{items.length}</section>
  ),
}));

import HouseholdSettingsPage from "@/app/(app)/settings/household/page";

const HOUSEHOLD = {
  id: "household-1",
  name: "Casa compartida",
  locale: "es",
  timezone: "UTC",
  version: 1,
};
const MEMBERSHIP = {
  household_id: HOUSEHOLD.id,
  household_name: HOUSEHOLD.name,
  role: "owner" as const,
  status: "active",
};
const INVITATION = {
  id: "invitation-1",
  household_id: "household-2",
  household_name: "Otro hogar",
  requested_role: "member" as const,
  expires_at: "2027-06-07T18:30:00Z",
  invited_by_display_name: "Ana",
};

function setApiResponses(invitations: unknown = { items: [] }) {
  serverApiFetch.mockImplementation((path: string) => {
    if (path === "/me") return Promise.resolve({ memberships: [MEMBERSHIP] });
    if (path === `/households/${HOUSEHOLD.id}`) return Promise.resolve(HOUSEHOLD);
    if (path === `/households/${HOUSEHOLD.id}/members`) return Promise.resolve({ items: [] });
    if (path === `/households/${HOUSEHOLD.id}/activity`) {
      return Promise.resolve({
        entries: [],
        page: 1,
        pageSize: 20,
        hasMore: false,
        outbox: { pending: 0, sent: 0, failed: 0, suppressed: 0 },
      });
    }
    if (path === "/me/invitations") {
      return invitations instanceof Error
        ? Promise.reject(invitations)
        : Promise.resolve(invitations);
    }
    throw new Error(`Unexpected API path: ${path}`);
  });
}

describe("household settings pending invitations", () => {
  beforeEach(() => {
    serverApiFetch.mockReset();
  });

  it("renders pending invitations when they are available", async () => {
    setApiResponses({ items: [INVITATION] });

    render(await HouseholdSettingsPage());

    expect(screen.getByTestId("pending-invitations")).toHaveTextContent("1");
    expect(serverApiFetch).toHaveBeenCalledWith("/me/invitations");
  });

  it("renders nothing for an empty pending invitation list", async () => {
    setApiResponses();

    render(await HouseholdSettingsPage());

    expect(screen.queryByTestId("pending-invitations")).not.toBeInTheDocument();
  });

  it("renders nothing when pending invitations fail to load", async () => {
    setApiResponses(new Error("Unavailable"));

    render(await HouseholdSettingsPage());

    expect(screen.queryByTestId("pending-invitations")).not.toBeInTheDocument();
  });
});
