import { BRING_GEAR, CLAY_HOUSE, kmBetween, LEND_GEAR, TRIP } from "./trip";
import type { Profile } from "./types";

export interface CarSummary {
  driver: Profile;
  seats: number;
  passengers: Profile[];
  free: number;
}

/** What one person owes (positive) or is owed (negative). */
export function bill(p: Profile, transportShare: number) {
  const food = p.hasCar ? 0 : p.agreeFood ? TRIP.foodBudget : 0;
  const booze = p.optInBooze ? TRIP.boozeBudget : 0;
  const spent = p.hasCar ? (p.fuelCost || 0) + (p.tollCost || 0) : 0;
  const total = food + booze + transportShare - spent;
  return { food, booze, transport: transportShare, spent, total: Math.round(total * 100) / 100 };
}

export function transportTotals(people: Profile[]) {
  const drivers = people.filter((p) => p.hasCar);
  const total = drivers.reduce((s, d) => s + (d.fuelCost || 0) + (d.tollCost || 0), 0);
  const logged = drivers.filter((d) => (d.fuelCost || 0) + (d.tollCost || 0) > 0).length;
  return { total, logged, drivers: drivers.length, share: people.length ? total / people.length : 0 };
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
  const needRide = people.filter((p) => !p.hasCar);
  const unassigned = needRide.filter((p) => !p.rideWith || !byPhone.get(p.rideWith)?.hasCar);
  const seatsNeeded = people.length;

  // Areas, nearest to Clay House first.
  const areas = new Map<string, { people: Profile[]; drivers: Profile[]; seats: number; km: number }>();
  for (const p of people) {
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
  const needBag = people.filter((p) => p.sleepSetup === "need");
  const needPad = people.filter((p) => p.padSetup === "need");
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

  // Money
  const transport = transportTotals(people);
  const bills = people.map((p) => ({ p, ...bill(p, transport.share) }));
  const money = {
    eaters: people.filter((p) => !p.hasCar && p.agreeFood).length,
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

  // Sunday
  const returning = {
    onTime: people.filter((p) => p.returnPref === "1pm"),
    later: people.filter((p) => p.returnPref === "later"),
    earlier: people.filter((p) => p.returnPref === "earlier").sort((a, b) => a.returnBy.localeCompare(b.returnBy)),
  };

  return {
    people,
    pending,
    cars,
    totalSeats,
    seatsNeeded,
    needRide,
    unassigned,
    areas: [...areas.entries()].sort((a, b) => a[1].km - b[1].km),
    gear,
    sleep: { beds, spareTentBeds, domeCap: TRIP.tentCapacity },
    money,
    diet: [...diet.entries()].sort((a, b) => b[1].length - a[1].length),
    dietNotes,
    returning,
  };
}
