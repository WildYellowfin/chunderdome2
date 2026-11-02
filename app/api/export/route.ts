import { NextResponse } from "next/server";
import { sessionPhone } from "@/lib/auth";
import { db, isAdmin } from "@/lib/db";
import { TRIP } from "@/lib/trip";

export const dynamic = "force-dynamic";

const esc = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET() {
  const phone = await sessionPhone();
  if (!phone || !(await isAdmin(phone))) return new NextResponse("Forbidden", { status: 403 });
  const all = await db.listProfiles();
  const byPhone = new Map(all.map((p) => [p.phone, p]));
  const header = ["name", "phone", "area", "area_detail", "travel", "has_car", "car_seats", "riding_with", "sleeping", "sleeping_bag", "pad", "spare_gear", "dietary", "dietary_notes", "venmo", "food_usd", "booze_usd", "owes_usd", "emergency_name", "emergency_phone", "stay_later", "notes", "onboarded"];
  const rows = all.map((p) => {
    const owes = (p.agreeFood ? TRIP.foodBudget : 0) + (p.optInBooze ? TRIP.boozeBudget : 0);
    return [
      p.name, p.phone, p.area, p.areaDetail, p.travel, p.hasCar ? "yes" : "no", p.hasCar ? p.carSeats : "",
      p.rideWith ? byPhone.get(p.rideWith)?.name ?? "" : "", p.sleeping, p.sleepSetup, p.padSetup,
      Object.entries(p.extras).filter(([, n]) => n > 0).map(([k, n]) => `${k}:${n}`).join(" "),
      p.dietary.join("; "), p.dietaryNotes, p.venmo, p.agreeFood ? TRIP.foodBudget : 0, p.optInBooze ? TRIP.boozeBudget : 0, owes,
      p.emergencyName, p.emergencyPhone, p.stayLater ? "yes" : "no", p.notes, p.onboardedAt ? "yes" : "no",
    ].map(esc).join(",");
  });
  return new NextResponse([header.join(","), ...rows].join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="chunderdome-ii.csv"' },
  });
}
