import { NextRequest } from "next/server";
import { handleIntakeStatus } from "funnel-core";

export async function GET(request: NextRequest) {
  return handleIntakeStatus(request);
}
