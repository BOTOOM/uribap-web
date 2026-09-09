import { z } from "zod";

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:8010/api/v1"),
});

export const publicEnv = publicEnvironmentSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});
