import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class MockApiRequestError extends Error {
    constructor(
      public readonly status: number,
      public readonly code: string,
      public readonly detail: string,
    ) {
      super(detail);
    }
  }

  return {
    ApiRequestError: MockApiRequestError,
    auth: vi.fn(),
    redirect: vi.fn(),
    serverApiFetch: vi.fn(),
  };
});

vi.mock("@/lib/auth/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/api/server-client", () => ({
  ApiRequestError: mocks.ApiRequestError,
  serverApiFetch: mocks.serverApiFetch,
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/components/household/OnboardingForm", () => ({ OnboardingForm: () => null }));

import OnboardingPage from "@/app/(public)/onboarding/page";

describe("onboarding route membership authority", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirect.mockImplementation((destination: string) => {
      throw new Error(`NEXT_REDIRECT:${destination}`);
    });
  });

  it("redirects unauthenticated sessions without requesting the API", async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(OnboardingPage()).rejects.toThrow("NEXT_REDIRECT:/login?returnTo=/onboarding");

    expect(mocks.serverApiFetch).not.toHaveBeenCalled();
  });

  it("does not redirect from stale session memberships when the API reports none", async () => {
    mocks.auth.mockResolvedValue({ user: { memberships: [{ householdId: "stale", status: "active" }] } });
    mocks.serverApiFetch.mockResolvedValue({ memberships: [] });

    const page = await OnboardingPage();

    expect(page.type).toBe("main");
    expect(mocks.serverApiFetch).toHaveBeenCalledWith("/me");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("keeps onboarding for inactive API memberships", async () => {
    mocks.auth.mockResolvedValue({ user: { memberships: [] } });
    mocks.serverApiFetch.mockResolvedValue({ memberships: [{ status: "inactive" }] });

    const page = await OnboardingPage();

    expect(page.type).toBe("main");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects when the API reports an active membership even if the session snapshot is empty", async () => {
    mocks.auth.mockResolvedValue({ user: { memberships: [] } });
    mocks.serverApiFetch.mockResolvedValue({ memberships: [{ status: "active" }] });

    await expect(OnboardingPage()).rejects.toThrow("NEXT_REDIRECT:/plan");
  });

  it("propagates non-401 API errors instead of trusting stale session data", async () => {
    const error = new mocks.ApiRequestError(503, "identity_provider_unavailable", "Unavailable");
    mocks.auth.mockResolvedValue({ user: { memberships: [{ householdId: "stale", status: "active" }] } });
    mocks.serverApiFetch.mockRejectedValue(error);

    await expect(OnboardingPage()).rejects.toBe(error);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects API 401 responses to login", async () => {
    mocks.auth.mockResolvedValue({ user: { memberships: [] } });
    mocks.serverApiFetch.mockRejectedValue(
      new mocks.ApiRequestError(401, "unauthorized", "Unauthorized"),
    );

    await expect(OnboardingPage()).rejects.toThrow("NEXT_REDIRECT:/login?returnTo=/onboarding");
  });
});
