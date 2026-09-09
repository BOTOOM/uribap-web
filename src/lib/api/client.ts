import createClient from "openapi-fetch";

import type { paths } from "@/lib/api/generated/schema";
import { publicEnv } from "@/lib/config/env";

export const apiClient = createClient<paths>({
  baseUrl: publicEnv.NEXT_PUBLIC_API_BASE_URL,
});
