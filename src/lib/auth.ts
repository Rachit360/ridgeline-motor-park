import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "rl_staff";
const SESSION_HOURS = 12;

const isProd = process.env.NODE_ENV === "production";

function secret() {
  const s = process.env.AUTH_SECRET || (isProd ? "" : "local-dev-secret-not-for-production");
  if (s.length < 16) throw new Error("AUTH_SECRET must be set (16+ characters).");
  return s;
}

/** Locally the staff password defaults to "admin" so the demo runs with no setup. */
export const adminPassword = () => process.env.ADMIN_PASSWORD || (isProd ? "" : "admin");

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("hex");

export function createSessionToken() {
  const expires = String(Date.now() + SESSION_HOURS * 3600_000);
  return `${expires}.${sign(expires)}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const [expires, sig] = token.split(".");
  if (!expires || !sig || Number(expires) < Date.now()) return false;
  const expected = Buffer.from(sign(expires));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function passwordMatches(input: string) {
  const real = adminPassword();
  if (!real) return false;
  const a = createHmac("sha256", "cmp").update(input).digest();
  const b = createHmac("sha256", "cmp").update(real).digest();
  return timingSafeEqual(a, b);
}

export async function isStaff() {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

export async function requireStaff(next = "/admin") {
  if (!(await isStaff())) redirect(`/admin/login?next=${encodeURIComponent(next)}`);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_HOURS * 3600,
};
