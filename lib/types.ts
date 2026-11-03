export type SleepSetup = "bag" | "blanket" | "need";
export type PadSetup = "own" | "need";
export type ReturnPref = "1pm" | "later" | "earlier";
/** 0 = a couple of small bags, 1 = a few duffels, 2 = several large suitcases */
export type Trunk = 0 | 1 | 2;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Profile {
  phone: string; // E.164, the user id
  name: string;
  pickup: LatLng | null; // dropped pin, rounded to ~100 m
  area: string; // neighbourhood label derived from the pin

  hasCar: boolean; // has a car and is willing to drive it
  carSeats: number; // total seats including the driver
  trunk: Trunk; // trunk space left with the car full

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

  // Drivers fill these in after the trip.
  fuelCost: number;
  tollCost: number;
  // Anything anyone bought for the group (groceries, ice, drinks); reimbursed.
  groupCost: number;

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
    carSeats: 5,
    trunk: 1,
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
    fuelCost: 0,
    tollCost: 0,
    groupCost: 0,
    notes: "",
    packed: [],
    rideWith: null,
    onboardedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}
