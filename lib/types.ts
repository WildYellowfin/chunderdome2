export type SleepSetup = "bag" | "blanket" | "need";
export type PadSetup = "own" | "need";
export type Sleeping = "chunderdome" | "own-tent" | "car" | "undecided";
export type Travel = "group" | "own-way" | "late";

export interface Profile {
  phone: string; // E.164, the user id
  name: string;
  area: string;
  areaDetail: string; // cross streets / neighbourhood, optional

  hasCar: boolean;
  carSeats: number; // total seats including the driver
  carNotes: string; // e.g. "big trunk", "can leave at 5"

  sleepSetup: SleepSetup;
  padSetup: PadSetup;
  extras: Record<string, number>;
  tentSleeps: number; // capacity of each spare tent
  bringing: string; // games, guitar, speaker, etc.

  dietary: string[];
  dietaryNotes: string;

  venmo: string;
  agreeFood: boolean;
  optInBooze: boolean;

  emergencyName: string;
  emergencyPhone: string;
  travel: Travel;
  sleeping: Sleeping;
  stayLater: boolean;
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
    area: "",
    areaDetail: "",
    hasCar: false,
    carSeats: 5,
    carNotes: "",
    sleepSetup: "bag",
    padSetup: "own",
    extras: {},
    tentSleeps: 2,
    bringing: "",
    dietary: [],
    dietaryNotes: "",
    venmo: "",
    agreeFood: false,
    optInBooze: false,
    emergencyName: "",
    emergencyPhone: "",
    travel: "group",
    sleeping: "chunderdome",
    stayLater: false,
    notes: "",
    packed: [],
    rideWith: null,
    onboardedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}
