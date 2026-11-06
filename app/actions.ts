"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  checkSmsCode,
  checkTripCode,
  clearSession,
  firebaseTokenPhone,
  requireAdmin,
  requireUser,
  sendSmsCode,
  setSession,
  verifyMode,
} from "@/lib/auth";
import { db, getOrCreateProfile, normalizePhone, ownerPhones } from "@/lib/db";
import { DIETARY_OPTIONS, EXTRA_GEAR, placeName } from "@/lib/trip";
import type { Profile, Trunk } from "@/lib/types";

export type FormState = { error?: string; phone?: string } | undefined;

// ---- Sign in ----------------------------------------------------------------

export async function startSignIn(_: FormState, form: FormData): Promise<FormState> {
  const typed = String(form.get("phone") || "");
  const phone = normalizePhone(typed);
  if (!phone) return { error: "That doesn't look like a phone number. Try something like (415) 555-0123.", phone: typed };
  const mode = verifyMode();

  if (mode === "closed") return { error: "Sign-in isn't set up yet. Tell the organiser.", phone: typed };
  if (mode === "firebase") return { error: "Something went wrong. Reload the page and try again.", phone: typed };
  if (mode === "trip-code") {
    if (!checkTripCode(String(form.get("tripCode") || ""))) {
      return { error: "Wrong trip code. It's in the group chat.", phone: typed };
    }
  }
  if (mode === "sms") {
    const ok = await sendSmsCode(phone).catch(() => false);
    if (!ok) return { error: "Couldn't send a text to that number. Double-check it?", phone: typed };
    redirect(`/login/verify?phone=${encodeURIComponent(phone)}`);
  }
  await setSession(phone);
  await getOrCreateProfile(phone);
  redirect("/");
}

export async function verifySignIn(_: FormState, form: FormData): Promise<FormState> {
  const phone = normalizePhone(String(form.get("phone") || ""));
  const code = String(form.get("code") || "").trim();
  if (!phone || !code) return { error: "Enter the code we texted you." };
  if (!(await checkSmsCode(phone, code).catch(() => false))) return { error: "That code didn't work. Try again, or resend." };
  await setSession(phone);
  await getOrCreateProfile(phone);
  redirect("/");
}

// Firebase texted the code and confirmed it in the browser; trust only the
// phone number inside the ID token Google signed.
export async function firebaseSignIn(idToken: string): Promise<FormState> {
  if (verifyMode() !== "firebase") return { error: "Sign-in isn't set up yet. Tell the organiser." };
  const verified = await firebaseTokenPhone(String(idToken || ""));
  const phone = verified && normalizePhone(verified);
  if (!phone) return { error: "That code didn't work. Try again, or resend." };
  await setSession(phone);
  await getOrCreateProfile(phone);
  redirect("/");
}

export async function signOut() {
  await clearSession();
  redirect("/login");
}

// ---- Onboarding ---------------------------------------------------------------

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const int = (v: unknown, min: number, max: number, dflt: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt;
};
const oneOf = <T extends string>(v: unknown, opts: readonly T[], dflt: T): T =>
  opts.includes(v as T) ? (v as T) : dflt;

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : NaN);

export async function saveProfile(input: Partial<Profile>): Promise<{ error?: string }> {
  const { profile } = await requireUser();

  const name = str(input.name, 60);
  if (!name) return { error: "We need your name." };

  const hasCar = !!input.hasCar;
  const ownWay = !hasCar && !!input.ownWay;
  const arrive = oneOf(input.arrive, ["fri", "sat-am", "sat-pm"] as const, "fri");
  const leave = oneOf(input.leave, ["sun", "sat"] as const, "sun");

  // Only people in the cars need a pin: riders to be picked up, drivers to match riders nearby.
  let pickup: Profile["pickup"] = null;
  if (!ownWay) {
    const lat = num(input.pickup?.lat);
    const lng = num(input.pickup?.lng);
    if (!(lat > 36 && lat < 39.5 && lng > -124 && lng < -121)) return { error: "Drop your pin somewhere in the Bay Area." };
    pickup = { lat: Math.round(lat * 1000) / 1000, lng: Math.round(lng * 1000) / 1000 };
  }

  // Sunday timing only matters to people coming home in the cars on Sunday.
  const askSunday = !ownWay && leave === "sun";
  const returnPref = askSunday ? oneOf(input.returnPref, ["1pm", "later", "earlier"] as const, "1pm") : "1pm";
  const returnBy = returnPref === "earlier" && /^\d{2}:\d{2}$/.test(str(input.returnBy)) ? str(input.returnBy) : "";
  if (returnPref === "earlier" && !returnBy) return { error: "Tell us when you need to be back on Sunday." };

  const extras: Record<string, number> = {};
  for (const g of EXTRA_GEAR) {
    const n = int(input.extras?.[g.key], 0, 20, 0);
    if (n) extras[g.key] = n;
  }
  const tents = (Array.isArray(input.tents) ? input.tents : []).slice(0, 6).map((t) => int(t, 1, 12, 2));

  const next: Profile = {
    ...profile,
    name,
    pickup,
    area: pickup ? placeName(pickup) : "",
    hasCar,
    ownWay,
    arrive,
    leave,
    carSeats: hasCar ? int(input.carSeats, 2, 12, 5) : 0,
    trunk: hasCar ? (int(input.trunk, 0, 2, 1) as Trunk) : 1,
    returnPref,
    returnBy,
    sleepSetup: oneOf(input.sleepSetup, ["bag", "blanket", "need"] as const, "bag"),
    padSetup: oneOf(input.padSetup, ["own", "need"] as const, "own"),
    extras,
    tents,
    dietary: (Array.isArray(input.dietary) ? input.dietary : []).filter((d) => DIETARY_OPTIONS.includes(d)),
    dietaryNotes: str(input.dietaryNotes, 300),
    venmo: str(input.venmo, 40).replace(/^@/, ""),
    agreeFood: !!input.agreeFood,
    optInBooze: !!input.optInBooze,
    fuelCost: hasCar ? profile.fuelCost : 0,
    tollCost: hasCar ? profile.tollCost : 0,
    groupCost: profile.groupCost || 0,
    notes: str(input.notes, 500),
    // A driver always rides in their own car; someone making their own way rides in none.
    rideWith: hasCar ? profile.phone : ownWay || profile.rideWith === profile.phone ? null : profile.rideWith,
    onboardedAt: profile.onboardedAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await db.saveProfile(next);
  revalidatePath("/", "layout");
  return {};
}

const dollars = (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? "").replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? Math.min(2000, Math.max(0, Math.round(n * 100) / 100)) : 0;
};

export async function saveCosts(_: FormState, form: FormData): Promise<FormState> {
  const { profile } = await requireUser();
  const driving = profile.hasCar
    ? { fuelCost: dollars(form.get("fuel")), tollCost: dollars(form.get("tolls")) }
    : {};
  await db.saveProfile({ ...profile, ...driving, groupCost: dollars(form.get("group")), updatedAt: new Date().toISOString() });
  revalidatePath("/", "layout");
  return {};
}

export async function togglePacked(itemId: string, done: boolean) {
  const { profile } = await requireUser();
  const set = new Set(profile.packed);
  if (done) set.add(itemId);
  else set.delete(itemId);
  await db.saveProfile({ ...profile, packed: [...set], updatedAt: new Date().toISOString() });
  revalidatePath("/packing");
}

// ---- Admin --------------------------------------------------------------------

export async function addAdmin(form: FormData) {
  await requireAdmin();
  const phone = normalizePhone(String(form.get("phone") || ""));
  if (phone) await db.addAdmin(phone);
  revalidatePath("/admin");
}

export async function removeAdmin(form: FormData) {
  const { phone: me } = await requireAdmin();
  const phone = String(form.get("phone") || "");
  if (phone && phone !== me && !ownerPhones().includes(phone)) await db.removeAdmin(phone);
  revalidatePath("/admin");
}

export async function assignRide(form: FormData) {
  await requireAdmin();
  const phone = String(form.get("phone") || "");
  const driver = String(form.get("driver") || "");
  const p = await db.getProfile(phone);
  if (!p) return;
  await db.saveProfile({ ...p, rideWith: driver || null, updatedAt: new Date().toISOString() });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function removePerson(form: FormData) {
  const { phone: me } = await requireAdmin();
  const phone = String(form.get("phone") || "");
  if (!phone || phone === me) return;
  // Unassign anyone riding with them.
  for (const p of await db.listProfiles()) {
    if (p.rideWith === phone && p.phone !== phone) await db.saveProfile({ ...p, rideWith: null });
  }
  await db.deleteProfile(phone);
  if (!ownerPhones().includes(phone)) await db.removeAdmin(phone);
  revalidatePath("/admin");
}
