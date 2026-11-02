import { EXTRA_GEAR, TRIP } from "./trip";
import type { Profile } from "./types";

export interface CarSummary {
  driver: Profile;
  seats: number;
  passengers: Profile[];
  free: number;
}

export function computeLogistics(all: Profile[]) {
  const people = all.filter((p) => p.onboardedAt);
  const pending = all.filter((p) => !p.onboardedAt);
  const byPhone = new Map(all.map((p) => [p.phone, p]));

  // Cars
  const drivers = people.filter((p) => p.hasCar && p.travel !== "late");
  const cars: CarSummary[] = drivers.map((d) => {
    const passengers = people.filter((p) => p.rideWith === d.phone && p.phone !== d.phone);
    return { driver: d, seats: d.carSeats, passengers, free: d.carSeats - 1 - passengers.length };
  });
  const totalSeats = drivers.reduce((s, d) => s + d.carSeats, 0);
  const needRide = people.filter((p) => p.travel === "group" && !p.hasCar);
  const unassigned = needRide.filter((p) => !p.rideWith || !byPhone.get(p.rideWith)?.hasCar);
  const seatsNeeded = people.filter((p) => p.travel === "group").length;

  // Areas
  const areas = new Map<string, { people: Profile[]; drivers: Profile[]; seats: number }>();
  for (const p of people) {
    const a = areas.get(p.area || "Unknown") ?? { people: [], drivers: [], seats: 0 };
    a.people.push(p);
    if (p.hasCar) {
      a.drivers.push(p);
      a.seats += p.carSeats;
    }
    areas.set(p.area || "Unknown", a);
  }

  // Sleep gear: need vs spare
  const needBag = people.filter((p) => p.sleepSetup === "need");
  const needPad = people.filter((p) => p.padSetup === "need");
  const spare = (key: string) => people.reduce((s, p) => s + (p.extras[key] || 0), 0);
  const gear = {
    bags: { need: needBag.length, spare: spare("sleepingBag") + spare("blanket"), who: needBag },
    pads: { need: needPad.length, spare: spare("sleepingPad"), who: needPad },
    headlamps: { spare: spare("headlamp") },
    extras: EXTRA_GEAR.map((g) => ({
      ...g,
      total: spare(g.key),
      owners: people.filter((p) => (p.extras[g.key] || 0) > 0).map((p) => ({ name: p.name, n: p.extras[g.key] })),
    })),
  };

  // Sleeping space
  const inDome = people.filter((p) => p.sleeping === "chunderdome" || p.sleeping === "undecided").length;
  const ownTents = people.filter((p) => p.sleeping === "own-tent").length;
  const inCars = people.filter((p) => p.sleeping === "car").length;
  const spareTentBeds = people.reduce((s, p) => s + (p.extras.tent || 0) * (p.tentSleeps || 2), 0);

  // Money
  const foodIn = people.filter((p) => p.agreeFood);
  const boozeIn = people.filter((p) => p.optInBooze);
  const money = {
    foodIn: foodIn.length,
    boozeIn: boozeIn.length,
    foodTotal: foodIn.length * TRIP.foodBudget,
    boozeTotal: boozeIn.length * TRIP.boozeBudget,
    missingVenmo: people.filter((p) => !p.venmo.trim()),
  };

  // Diet
  const diet = new Map<string, string[]>();
  for (const p of people) for (const d of p.dietary) diet.set(d, [...(diet.get(d) ?? []), p.name]);
  const dietNotes = people.filter((p) => p.dietaryNotes.trim()).map((p) => ({ name: p.name, note: p.dietaryNotes }));

  return {
    people,
    pending,
    cars,
    totalSeats,
    seatsNeeded,
    needRide,
    unassigned,
    areas: [...areas.entries()].sort((a, b) => b[1].people.length - a[1].people.length),
    gear,
    sleep: { inDome, ownTents, inCars, spareTentBeds, domeCap: TRIP.tentCapacity },
    money,
    diet: [...diet.entries()].sort((a, b) => b[1].length - a[1].length),
    dietNotes,
    stayLater: people.filter((p) => p.stayLater),
    lateArrivals: people.filter((p) => p.travel === "late"),
    missingEmergency: people.filter((p) => !p.emergencyPhone.trim()),
  };
}
