import { z } from "zod";

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:8010/api/v1"),
});

export const publicEnv = publicEnvironmentSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

export const serverEnv = {
  AUTH_SECRET: process.env.AUTH_SECRET ?? "",
  AUTH_ZITADEL_ID: process.env.AUTH_ZITADEL_ID ?? "",
  AUTH_ZITADEL_SECRET: process.env.AUTH_ZITADEL_SECRET ?? "",
  AUTH_ZITADEL_ISSUER: process.env.AUTH_ZITADEL_ISSUER ?? "http://localhost:8080",
  URIBAP_API_INTERNAL_URL:
    process.env.URIBAP_API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8010/api/v1",
  AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST ?? "true",
};

export function assertServerAuthConfiguration() {
  if (!serverEnv.AUTH_SECRET || serverEnv.AUTH_SECRET.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters for authenticated requests.");
  }
  if (!serverEnv.AUTH_ZITADEL_ID || !serverEnv.AUTH_ZITADEL_SECRET) {
    throw new Error("AUTH_ZITADEL_ID and AUTH_ZITADEL_SECRET are required for ZITADEL login.");
  }
}

export function isLocalIdentityIssuer(value: string) {
  return value === "http://localhost:8080" || value === "http://host.docker.internal:8080";
}
