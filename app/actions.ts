"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  checkSmsCode,
  checkTripCode,
  clearSession,
  requireAdmin,
  requireUser,
  sendSmsCode,
  setSession,
  verifyMode,
} from "@/lib/auth";
import { db, getOrCreateProfile, normalizePhone, ownerPhones } from "@/lib/db";
import { AREAS, DIETARY_OPTIONS, EXTRA_GEAR } from "@/lib/trip";
import type { Profile } from "@/lib/types";

export type FormState = { error?: string } | undefined;

// ---- Sign in ----------------------------------------------------------------

export async function startSignIn(_: FormState, form: FormData): Promise<FormState> {
  const phone = normalizePhone(String(form.get("phone") || ""));
  if (!phone) return { error: "That doesn't look like a phone number. Try something like (415) 555-0123." };
  const mode = verifyMode();

  if (mode === "trip-code") {
    if (!checkTripCode(String(form.get("tripCode") || ""))) {
      return { error: "Wrong trip code. It's in the group chat." };
    }
  }
  if (mode === "sms") {
    const ok = await sendSmsCode(phone);
    if (!ok) return { error: "Couldn't send a text to that number. Double-check it?" };
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
  if (!(await checkSmsCode(phone, code))) return { error: "That code didn't work. Try again, or resend." };
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

export async function saveProfile(input: Partial<Profile>): Promise<{ error?: string }> {
  const { profile } = await requireUser();

  const name = str(input.name, 60);
  if (!name) return { error: "We need your name." };
  const area = AREAS.includes(str(input.area)) ? str(input.area) : "";
  if (!area) return { error: "Pick roughly where you'll be leaving from." };
  const venmo = str(input.venmo, 40).replace(/^@/, "");
  if (!venmo) return { error: "Add your Venmo so settling up is painless." };
  if (!input.agreeFood) return { error: `Please agree to the food budget so we can feed you.` };

  const extras: Record<string, number> = {};
  for (const g of EXTRA_GEAR) {
    const n = int(input.extras?.[g.key], 0, 20, 0);
    if (n) extras[g.key] = n;
  }

  const hasCar = !!input.hasCar;
  const next: Profile = {
    ...profile,
    name,
    area,
    areaDetail: str(input.areaDetail, 80),
    hasCar,
    carSeats: hasCar ? int(input.carSeats, 2, 9, 5) : 0,
    carNotes: hasCar ? str(input.carNotes, 200) : "",
    sleepSetup: oneOf(input.sleepSetup, ["bag", "blanket", "need"] as const, "bag"),
    padSetup: oneOf(input.padSetup, ["own", "need"] as const, "own"),
    extras,
    tentSleeps: int(input.tentSleeps, 1, 12, 2),
    bringing: str(input.bringing, 200),
    dietary: (Array.isArray(input.dietary) ? input.dietary : []).filter((d) => DIETARY_OPTIONS.includes(d)),
    dietaryNotes: str(input.dietaryNotes, 300),
    venmo,
    agreeFood: true,
    optInBooze: !!input.optInBooze,
    emergencyName: str(input.emergencyName, 60),
    emergencyPhone: str(input.emergencyPhone, 30),
    travel: oneOf(input.travel, ["group", "own-way", "late"] as const, "group"),
    sleeping: oneOf(input.sleeping, ["chunderdome", "own-tent", "car", "undecided"] as const, "chunderdome"),
    stayLater: !!input.stayLater,
    notes: str(input.notes, 500),
    // A driver always rides in their own car.
    rideWith: hasCar ? profile.phone : profile.rideWith === profile.phone ? null : profile.rideWith,
    onboardedAt: profile.onboardedAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await db.saveProfile(next);
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
  revalidatePath("/admin");
}
