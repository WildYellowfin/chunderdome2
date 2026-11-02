import { NextResponse } from "next/server";
import { sessionPhone } from "@/lib/auth";
import { db, isAdmin } from "@/lib/db";
import { computeLogistics } from "@/lib/logistics";
import { TRUNK_OPTIONS } from "@/lib/trip";

export const dynamic = "force-dynamic";

const esc = (v: unknown) => {
  let s = String(v ?? "");
  // Names and notes are typed by guests; stop Sheets/Excel running them as formulas.
  if (/^[=+\-@\t\r]/.test(s) && typeof v === "string" && !/^[+-]?[\d.]+$/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET() {
  const phone = await sessionPhone();
  if (!phone || !(await isAdmin(phone))) return new NextResponse("Forbidden", { status: 403 });
  const all = await db.listProfiles();
  const byPhone = new Map(all.map((p) => [p.phone, p]));
  const bills = new Map(computeLogistics(all).money.bills.map((b) => [b.p.phone, b]));
  const header = ["name", "phone", "pickup_area", "pickup_lat", "pickup_lng", "driving", "car_seats", "trunk", "riding_with", "sunday", "back_by", "sleeping_bag", "pad", "lending", "tents_to_lend", "bringing", "dietary", "dietary_notes", "venmo", "food_usd", "booze_usd", "transport_usd", "fuel_spent_usd", "toll_spent_usd", "total_usd", "notes", "onboarded"];
  const rows = all.map((p) => {
    const b = bills.get(p.phone);
    const ex = Object.entries(p.extras || {}).filter(([, n]) => n > 0);
    return [
      p.name, p.phone, p.area, p.pickup?.lat ?? "", p.pickup?.lng ?? "", p.hasCar ? "yes" : "no", p.hasCar ? p.carSeats : "",
      p.hasCar ? TRUNK_OPTIONS[p.trunk ?? 1] : "", p.rideWith ? byPhone.get(p.rideWith)?.name ?? "" : "", p.returnPref, p.returnBy,
      p.sleepSetup, p.padSetup,
      ex.filter(([k]) => k === "sleepingBag" || k === "sleepingPad").map(([k, n]) => `${k}:${n}`).join(" "),
      (p.tents || []).join(" "),
      ex.filter(([k]) => k !== "sleepingBag" && k !== "sleepingPad").map(([k, n]) => `${k}:${n}`).join(" "),
      (p.dietary || []).join("; "), p.dietaryNotes, p.venmo,
      b?.food ?? "", b?.booze ?? "", b ? b.transport.toFixed(2) : "", p.fuelCost || 0, p.tollCost || 0, b ? b.total.toFixed(2) : "",
      p.notes, p.onboardedAt ? "yes" : "no",
    ].map(esc).join(",");
  });
  return new NextResponse([header.join(","), ...rows].join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="chunderdome-ii.csv"' },
  });
}
