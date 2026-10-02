import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigationMocks,
}));

import { InvitationAcceptanceForm } from "@/components/household/InvitationAcceptanceForm";

const FLOW = "123e4567-e89b-42d3-a456-426614174000";
const TOKEN = "manual_invitation-token_123";
const fetchMock = vi.fn();

describe("InvitationAcceptanceForm", () => {
  beforeEach(() => {
    navigationMocks.push.mockReset();
    navigationMocks.refresh.mockReset();
    fetchMock.mockReset().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("accepts a held invitation without rendering its token input", async () => {
    render(<InvitationAcceptanceForm flow={FLOW} hasHeldInvitation />);

    expect(screen.queryByLabelText("Código de invitación")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Aceptar invitación" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/invitations/accept",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ flow: FLOW }),
        }),
      ),
    );
    expect(navigationMocks.push).toHaveBeenCalledWith("/plan");
    expect(navigationMocks.refresh).toHaveBeenCalledOnce();
  });

  it("keeps manual token entry when there is no held invitation", async () => {
    render(<InvitationAcceptanceForm flow={null} hasHeldInvitation={false} />);

    fireEvent.change(screen.getByLabelText("Código de invitación"), {
      target: { value: TOKEN },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aceptar invitación" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/invitations/accept",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ token: TOKEN }),
        }),
      ),
    );
  });
});
