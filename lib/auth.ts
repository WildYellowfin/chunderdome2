import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
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
// Preferred: Firebase phone auth (set FIREBASE_API_KEY and FIREBASE_PROJECT_ID): Firebase texts the code and checks it in the
// browser, and the server verifies the signed ID token it hands back. Then
// Twilio Verify (set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
// TWILIO_VERIFY_SERVICE_SID). Fallback: a shared TRIP_CODE you text to the
// group chat. With none set, sign-in only needs a phone number, which is
// fine locally but means anyone could claim any number.

export type VerifyMode = "firebase" | "sms" | "trip-code" | "open" | "closed";

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
}

// These are the public web-app config values Firebase gives you, not secrets.
// Read on the server at request time and handed to the login form as props.
export function firebaseConfig(): FirebaseWebConfig | null {
  const apiKey = process.env.FIREBASE_API_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId) return null;
  return { apiKey, projectId, authDomain: process.env.FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com` };
}

const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));

/** The phone number a Firebase ID token was issued for, or null if the token doesn't check out. */
export async function firebaseTokenPhone(idToken: string): Promise<string | null> {
  const config = firebaseConfig();
  if (!config) return null;
  try {
    const { payload } = await jwtVerify(idToken, googleKeys, {
      issuer: `https://securetoken.google.com/${config.projectId}`,
      audience: config.projectId,
    });
    return typeof payload.phone_number === "string" && payload.sub ? payload.phone_number : null;
  } catch (e) {
    console.error("Firebase token rejected", e instanceof Error ? e.message : e);
    return null;
  }
}

export function verifyMode(): VerifyMode {
  if (firebaseConfig()) return "firebase";
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID) {
    return "sms";
  }
  if (process.env.TRIP_CODE) return "trip-code";
  // Open sign-in would let anyone type an owner's number and become admin, so
  // a production deploy with neither set refuses to sign anyone in.
  return process.env.NODE_ENV === "production" ? "closed" : "open";
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
  if (!res.ok) console.error("Twilio send failed", res.status, await res.text().catch(() => ""));
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
