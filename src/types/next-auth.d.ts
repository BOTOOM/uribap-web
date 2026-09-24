import type { DefaultSession } from "next-auth";

export type HouseholdMembership = {
  householdId: string;
  householdName: string;
  role: "owner" | "admin" | "member";
  status: string;
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      emailVerified: boolean;
      memberships: HouseholdMembership[];
      activeHouseholdId?: string;
    } & DefaultSession["user"];
    authenticatedAt?: number;
    authSessionFingerprint?: string;
    error?: string;
    refreshFailureFingerprint?: string;
    refreshSessionFingerprint?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    accessTokenExpires?: number;
    internalUserId?: string;
    emailVerified?: boolean;
    memberships?: HouseholdMembership[];
    authenticatedAt?: number;
    authSessionEpoch?: string;
    refreshSessionEpoch?: string;
    error?: string;
    refreshFailureFingerprint?: string;
    refreshSessionFingerprint?: string;
  }
}
