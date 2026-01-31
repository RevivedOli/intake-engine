import { NextRequest } from "next/server";
import { handleIntakePost } from "funnel-core";
import config from "../../../config";

const APP_ID = "lionsden";

export async function POST(request: NextRequest) {
  return handleIntakePost(request, config, APP_ID);
}
