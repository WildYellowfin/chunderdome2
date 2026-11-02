import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getOrCreateProfile, isAdmin } from "./db";

const COOKIE = "cd2_session";
const MAX_AGE = 60 * 60 * 24 * 60; // 60 days

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set (16+ characters) in production.");
  }
  return "dev-only-secret-change-me";
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export async function setSession(phone: string) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `${phone}.${exp}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function sessionPhone(): Promise<string | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [phone, exp, sig] = parts;
  const expected = sign(`${phone}.${exp}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  return phone;
}

export async function requireUser() {
  const phone = await sessionPhone();
  if (!phone) redirect("/login");
  const profile = await getOrCreateProfile(phone);
  const admin = await isAdmin(phone);
  return { phone, profile, admin };
}

export async function requireOnboarded() {
  const u = await requireUser();
  if (!u.profile.onboardedAt) redirect("/onboarding");
  return u;
}

export async function requireAdmin() {
  const u = await requireUser();
  if (!u.admin) redirect("/");
  return u;
}

// ---- Phone verification -------------------------------------------------
// Preferred: Twilio Verify (set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
// TWILIO_VERIFY_SERVICE_SID). Fallback: a shared TRIP_CODE you text to the
// group chat. With neither set, sign-in only needs a phone number, which is
// fine locally but means anyone could claim any number.

export type VerifyMode = "sms" | "trip-code" | "open";

export function verifyMode(): VerifyMode {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID) {
    return "sms";
  }
  if (process.env.TRIP_CODE) return "trip-code";
  return "open";
}

function twilioAuth() {
  return "Basic " + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
}

export async function sendSmsCode(phone: string): Promise<boolean> {
  const res = await fetch(
    `https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/Verifications`,
    {
      method: "POST",
      headers: { Authorization: twilioAuth(), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: phone, Channel: "sms" }),
    },
  );
  return res.ok;
}

export async function checkSmsCode(phone: string, code: string): Promise<boolean> {
  const res = await fetch(
    `https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
    {
      method: "POST",
      headers: { Authorization: twilioAuth(), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: phone, Code: code }),
    },
  );
  if (!res.ok) return false;
  const json = (await res.json()) as { status?: string };
  return json.status === "approved";
}

export function checkTripCode(code: string): boolean {
  const expected = process.env.TRIP_CODE || "";
  const a = Buffer.from(code.trim().toLowerCase());
  const b = Buffer.from(expected.trim().toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}
