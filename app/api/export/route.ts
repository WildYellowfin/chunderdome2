import { NextResponse } from "next/server";
import { sessionPhone } from "@/lib/auth";
import { db, isAdmin } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { spent } from "@/lib/logistics";
import { TRUNK_OPTIONS } from "@/lib/trip";

export const dynamic = "force-dynamic";

export async function GET() {
  const phone = await sessionPhone();
  if (!phone || !(await isAdmin(phone))) return new NextResponse("Forbidden", { status: 403 });
  const all = await db.listProfiles();
  const byPhone = new Map(all.map((p) => [p.phone, p]));
  const header = ["name", "phone", "getting_there", "arriving", "leaving", "pickup_area", "pickup_lat", "pickup_lng", "driving", "car_seats", "trunk", "riding_with", "sunday", "back_by", "sleeping_bag", "pad", "lending", "tents_to_lend", "bringing", "dietary", "dietary_notes", "venmo", "eating", "drinking", "spent_usd", "expenses", "notes", "onboarded"];
  const rows = all.map((p) => {
    const ex = Object.entries(p.extras || {}).filter(([, n]) => n > 0);
    return [
      p.name, p.phone, p.hasCar ? "driving" : p.ownWay ? "own way" : "riding", p.arrive, p.leave, p.area, p.pickup?.lat ?? "", p.pickup?.lng ?? "", p.hasCar ? "yes" : "no", p.hasCar ? p.carSeats : "",
      p.hasCar ? TRUNK_OPTIONS[p.trunk ?? 1] : "", p.rideWith ? byPhone.get(p.rideWith)?.name ?? "" : "", p.returnPref, p.returnBy,
      p.sleepSetup, p.padSetup,
      ex.filter(([k]) => k === "sleepingBag" || k === "sleepingPad").map(([k, n]) => `${k}:${n}`).join(" "),
      (p.tents || []).join(" "),
      ex.filter(([k]) => k !== "sleepingBag" && k !== "sleepingPad").map(([k, n]) => `${k}:${n}`).join(" "),
      (p.dietary || []).join("; "), p.dietaryNotes, p.venmo,
      p.agreeFood ? "yes" : "no", p.optInBooze ? "yes" : "no", spent(p).toFixed(2), p.expenses.map((e) => `${e.note} ${e.amount.toFixed(2)}`).join("; "),
      p.notes, p.onboardedAt ? "yes" : "no",
    ];
  });
  return new NextResponse(toCsv([header, ...rows]), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="chunderdome-ii.csv"' },
  });
}
