import type { NextRequest } from "next/server";

import { handlers } from "@/lib/auth/auth";
import { stripPrivateSessionMetadata } from "@/lib/auth/session-response";

export const GET = async (request: NextRequest) =>
  stripPrivateSessionMetadata(await handlers.GET(request));
export const POST = async (request: NextRequest) =>
  stripPrivateSessionMetadata(await handlers.POST(request));
