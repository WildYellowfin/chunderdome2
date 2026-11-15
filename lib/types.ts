export type SleepSetup = "bag" | "blanket" | "need";
export type PadSetup = "own" | "need";
export type ReturnPref = "1pm" | "later" | "earlier";
/** Most people come for the whole weekend; these only change for those who don't. */
export type Arrive = "fri" | "sat-am" | "sat-pm";
export type Leave = "sun" | "sat";
/** 0 = a couple of small bags, 1 = a few duffels, 2 = several large suitcases */
export type Trunk = 0 | 1 | 2;

export interface LatLng {
  lat: number;
  lng: number;
}

/** Something one person paid for the group: groceries, drinks, gas, tolls, ice. */
export interface Expense {
  id: string;
  amount: number; // dollars, to the cent
  note: string; // what it was for
  at: string;
}

export interface Profile {
  phone: string; // E.164, the user id
  name: string;
  pickup: LatLng | null; // dropped pin, rounded to ~100 m
  area: string; // neighbourhood label derived from the pin

  hasCar: boolean; // driving one of the group's cars, taking riders
  ownWay: boolean; // getting there on their own: no pickup, no seat, out of the fuel split
  carSeats: number; // total seats including the driver
  trunk: Trunk; // trunk space left with the car full

  arrive: Arrive;
  leave: Leave;

  returnPref: ReturnPref;
  returnBy: string; // "HH:MM" on Sunday, when returnPref is "earlier"

  sleepSetup: SleepSetup;
  padSetup: PadSetup;
  // Things to lend or bring, by EXTRA_GEAR / BRING_GEAR key.
  extras: Record<string, number>;
  tents: number[]; // spare tents to lend, each entry is how many it sleeps

  dietary: string[];
  dietaryNotes: string;

  venmo: string; // optional
  agreeFood: boolean;
  optInBooze: boolean;

  // Anything they paid for the group, one entry per expense; settled up after the trip.
  expenses: Expense[];
  // Before expenses were itemised: a driver's fuel and tolls, and one lump for
  // everything else. Older profiles are folded into `expenses` when read (lib/db.ts).
  fuelCost?: number;
  tollCost?: number;
  groupCost?: number;

  notes: string;

  // App state
  packed: string[];
  rideWith: string | null; // phone of driver they're assigned to (admin-set)
  onboardedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function emptyProfile(phone: string): Profile {
  const now = new Date().toISOString();
  return {
    phone,
    name: "",
    pickup: null,
    area: "",
    hasCar: false,
    ownWay: false,
    carSeats: 5,
    trunk: 1,
    arrive: "fri",
    leave: "sun",
    returnPref: "1pm",
    returnBy: "",
    sleepSetup: "bag",
    padSetup: "own",
    extras: {},
    tents: [],
    dietary: [],
    dietaryNotes: "",
    venmo: "",
    agreeFood: false,
    optInBooze: false,
    expenses: [],
    notes: "",
    packed: [],
    rideWith: null,
    onboardedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}
