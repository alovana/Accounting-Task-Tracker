import { createHash, timingSafeEqual } from "node:crypto";

const DEMO_ACCESS_TOKEN_HASH = "8557e2a43e10395ff4eeecce975d761119c7ca97f5b94141c58dcd0453d2b1cf";

export function isValidDemoAccessToken(token?: string | null) {
  if (!token) {
    return false;
  }

  const actual = createHash("sha256").update(token).digest();
  const expected = Buffer.from(DEMO_ACCESS_TOKEN_HASH, "hex");

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
