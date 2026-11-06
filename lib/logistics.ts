import { ARRIVE_OPTIONS, BRING_GEAR, CLAY_HOUSE, kmBetween, LEND_GEAR, TRIP } from "./trip";
import type { Profile } from "./types";

// ---- Who's there when ---------------------------------------------------------

type Stay = Pick<Profile, "arrive" | "leave">;
export const wholeWeekend = (p: Stay) => p.arrive === "fri" && p.leave === "sun";
export const friNight = (p: Stay) => p.arrive === "fri";
export const satNight = (p: Stay) => p.leave === "sun";
export const sleepsOver = (p: Stay) => friNight(p) || satNight(p);

/** "Saturday morning to Sunday", or "Whole weekend". */
export function stayLabel(p: Stay) {
  if (wholeWeekend(p)) return "Whole weekend";
  const a = ARRIVE_OPTIONS.find((o) => o.value === p.arrive)!;
  return `${a.title} ${a.sub} to ${p.leave === "sun" ? "Sunday" : "Saturday evening"}`;
}

/** In one of the group's cars, as a driver or a rider. */
export const inCars = (p: Pick<Profile, "ownWay">) => !p.ownWay;

export interface CarSummary {
  driver: Profile;
  seats: number;
  passengers: Profile[];
  free: number;
}

/** What one person owes (positive) or is owed (negative). */
// People making their own way pay for their own petrol and stay out of the cars' split.
export function bill(p: Profile, transportShare: number) {
  const food = p.agreeFood && !p.hasCar ? TRIP.foodBudget : 0;
  const booze = p.optInBooze ? TRIP.boozeBudget : 0;
  const transport = inCars(p) ? transportShare : 0;
  const spent = (p.hasCar ? (p.fuelCost || 0) + (p.tollCost || 0) : 0) + (p.groupCost || 0);
  const total = food + booze + transport - spent;
  return { food, booze, transport, spent, total: Math.round(total * 100) / 100 };
}

export function transportTotals(people: Profile[]) {
  const drivers = people.filter((p) => p.hasCar);
  const riding = people.filter(inCars).length;
  const total = drivers.reduce((s, d) => s + (d.fuelCost || 0) + (d.tollCost || 0), 0);
  const logged = drivers.filter((d) => (d.fuelCost || 0) + (d.tollCost || 0) > 0).length;
  return { total, logged, drivers: drivers.length, riding, share: riding ? total / riding : 0 };
}

/** Seats offered vs people who need one, leaving out whoever is asking. */
export function seatCount(people: Profile[], except: string) {
  const others = people.filter((p) => p.phone !== except);
  const drivers = others.filter((p) => p.hasCar);
  return {
    cars: drivers.length,
    spare: drivers.reduce((s, d) => s + Math.max(0, d.carSeats - 1), 0),
    riders: others.filter((p) => !p.hasCar && inCars(p)).length,
  };
}

export const usd = (n: number) => `${n < 0 ? "−" : ""}$${Math.abs(n).toFixed(Number.isInteger(Math.round(n * 100) / 100) ? 0 : 2)}`;

export function computeLogistics(all: Profile[]) {
  const people = all.filter((p) => p.onboardedAt);
  const pending = all.filter((p) => !p.onboardedAt);
  const byPhone = new Map(all.map((p) => [p.phone, p]));

  // Cars
  const drivers = people.filter((p) => p.hasCar);
  const cars: CarSummary[] = drivers.map((d) => {
    const passengers = people.filter((p) => p.rideWith === d.phone && p.phone !== d.phone);
    return { driver: d, seats: d.carSeats, passengers, free: d.carSeats - 1 - passengers.length };
  });
  const totalSeats = drivers.reduce((s, d) => s + d.carSeats, 0);
  const needRide = people.filter((p) => !p.hasCar && inCars(p));
  const unassigned = needRide.filter((p) => !p.rideWith || !byPhone.get(p.rideWith)?.hasCar);
  const ownWay = people.filter((p) => !inCars(p));
  const seatsNeeded = people.length - ownWay.length;

  // Who's there when.
  const weekend = {
    friNight: people.filter(friNight),
    saturday: people,
    satNight: people.filter(satNight),
    partial: people.filter((p) => !wholeWeekend(p)),
  };

  // Areas, nearest to Clay House first.
  const areas = new Map<string, { people: Profile[]; drivers: Profile[]; seats: number; km: number }>();
  for (const p of people.filter(inCars)) {
    const key = p.area || "No pin yet";
    const a = areas.get(key) ?? { people: [], drivers: [], seats: 0, km: p.pickup ? kmBetween(p.pickup, CLAY_HOUSE) : 999 };
    a.people.push(p);
    if (p.hasCar) {
      a.drivers.push(p);
      a.seats += p.carSeats;
    }
    areas.set(key, a);
  }

  // Sleep gear: need vs spare
  const needBag = people.filter((p) => sleepsOver(p) && p.sleepSetup === "need");
  const needPad = people.filter((p) => sleepsOver(p) && p.padSetup === "need");
  const sum = (key: string) => people.reduce((s, p) => s + (p.extras[key] || 0), 0);
  const owners = (key: string) => people.filter((p) => (p.extras[key] || 0) > 0).map((p) => ({ name: p.name, n: p.extras[key] }));
  const tents = people.flatMap((p) => (p.tents || []).map((sleeps) => ({ name: p.name, sleeps })));
  const gear = {
    bags: { need: needBag.length, spare: sum("sleepingBag"), who: needBag },
    pads: { need: needPad.length, spare: sum("sleepingPad"), who: needPad },
    lend: LEND_GEAR.map((g) => ({ ...g, total: sum(g.key), owners: owners(g.key) })),
    tents,
    bring: BRING_GEAR.map((g) => ({ ...g, total: sum(g.key), owners: owners(g.key) })),
  };

  // Sleeping space
  const spareTentBeds = tents.reduce((s, t) => s + t.sleeps, 0);
  const beds = TRIP.tentCapacity + TRIP.groupSmallTentBeds + spareTentBeds;
  const sleepers = Math.max(weekend.friNight.length, weekend.satNight.length);

  // Money
  const transport = transportTotals(people);
  const bills = people.map((p) => ({ p, ...bill(p, transport.share) }));
  const money = {
    eaters: people.filter((p) => p.agreeFood).length,
    boozeIn: people.filter((p) => p.optInBooze).length,
    foodTotal: bills.reduce((s, b) => s + b.food, 0),
    boozeTotal: bills.reduce((s, b) => s + b.booze, 0),
    transport,
    bills,
    noVenmo: people.filter((p) => !p.venmo.trim()),
  };

  // Diet
  const diet = new Map<string, string[]>();
  for (const p of people) for (const d of p.dietary) diet.set(d, [...(diet.get(d) ?? []), p.name]);
  const dietNotes = people.filter((p) => p.dietaryNotes.trim()).map((p) => ({ name: p.name, note: p.dietaryNotes }));

  // Sunday, for whoever is coming back in the cars.
  const goingHome = people.filter((p) => inCars(p) && satNight(p));
  const returning = {
    onTime: goingHome.filter((p) => p.returnPref === "1pm"),
    later: goingHome.filter((p) => p.returnPref === "later"),
    earlier: goingHome.filter((p) => p.returnPref === "earlier").sort((a, b) => a.returnBy.localeCompare(b.returnBy)),
  };

  return {
    people,
    pending,
    cars,
    totalSeats,
    seatsNeeded,
    needRide,
    unassigned,
    ownWay,
    weekend,
    areas: [...areas.entries()].sort((a, b) => a[1].km - b[1].km),
    gear,
    sleep: { beds, sleepers, spareTentBeds, domeCap: TRIP.tentCapacity },
    money,
    diet: [...diet.entries()].sort((a, b) => b[1].length - a[1].length),
    dietNotes,
    returning,
  };
}

/** What a bill is for, as a Venmo note. */
export function billNote(b: ReturnType<typeof bill>) {
  const parts = [b.food ? `food ${usd(b.food)}` : "", b.booze ? `drinks ${usd(b.booze)}` : "", b.transport ? `fuel+tolls ${usd(b.transport)}` : "", b.spent ? `minus ${usd(b.spent)} you spent` : ""].filter(Boolean);
  return `Chunderdome II: ${parts.join(", ")}`;
}

/**
 * A Venmo link with the person, amount and note filled in. On a phone with
 * Venmo installed it opens the app; elsewhere it opens venmo.com.
 * Positive totals are requests (they owe you); negative ones are payments.
 */
export function venmoLink(handle: string, b: ReturnType<typeof bill>) {
  const q = new URLSearchParams({
    txn: b.total < 0 ? "pay" : "charge",
    audience: "private",
    recipients: handle,
    amount: Math.abs(b.total).toFixed(2),
    note: billNote(b),
  });
  // Venmo shows a literal "+" in notes, so encode spaces as %20.
  return `https://venmo.com/?${q.toString().replace(/\+/g, "%20")}`;
}
