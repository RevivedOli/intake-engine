import { createNeonAuth } from "@neondatabase/auth/next/server";

const baseUrl = process.env.NEON_AUTH_BASE_URL ?? "https://placeholder";
const cookieSecret =
  process.env.NEON_AUTH_COOKIE_SECRET ??
  "build-time-placeholder-min-32-chars-long";

export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: cookieSecret,
  },
});
