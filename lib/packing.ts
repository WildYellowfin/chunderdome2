import type { Profile } from "./types";

export interface PackItem {
  id: string;
  label: string;
  hint?: string;
  section: string;
}

// Personalised packing list. Nights at Dillon Beach in mid-November drop to
// the mid-40s °F, wind off the ocean, damp fog by morning.
export function packingList(p: Profile): PackItem[] {
  const items: PackItem[] = [];
  const add = (section: string, id: string, label: string, hint?: string) =>
    items.push({ section, id, label, hint });

  const S = "Sleep";
  if (p.sleepSetup === "bag") add(S, "sleeping-bag", "Sleeping bag", "Rated to 40°F or warmer is ideal.");
  if (p.sleepSetup === "blanket") add(S, "blanket", "A big, warm blanket (or two)", "It gets cold. Bring more than you think.");
  if (p.sleepSetup === "need") add(S, "borrow-bag", "Borrow a sleeping bag", "You said you need one. An admin will match you with a spare.");
  if (p.padSetup === "own") add(S, "pad", "Sleeping pad");
  else add(S, "borrow-pad", "Borrow a sleeping pad", "You said you need one. An admin will match you with a spare.");
  add(S, "pillow", "Pillow", "Or a stuff sack full of clothes.");
  if (p.sleeping === "own-tent") add(S, "tent", "Your tent, poles, and stakes");

  const C = "Clothes";
  add(C, "warm-layer", "Warm jacket or puffy");
  add(C, "rain-layer", "Rain / wind shell");
  add(C, "beanie", "Beanie");
  add(C, "sleep-clothes", "Dry, warm clothes just for sleeping");
  add(C, "socks", "Wool socks (extra pair)");
  add(C, "shoes", "Shoes that can get sandy and wet");
  add(C, "change", "Change of clothes for Sunday");

  const G = "Gear";
  add(G, "headlamp", "Headlamp or torch", "We arrive after dark. Keep it in your pocket, not your bag.");
  add(G, "water-bottle", "Water bottle");
  add(G, "mug", "Mug, plate, bowl, and utensils", "Reusable, and labelled with your name if you can.");
  add(G, "chair", "Camp chair (if you have one)");
  add(G, "battery", "Phone battery pack");

  const B = "Body";
  add(B, "toiletries", "Toothbrush and toiletries");
  add(B, "meds", "Any meds you need");
  add(B, "sunscreen", "Sunscreen and lip balm");
  add(B, "towel", "Small towel");

  const F = "Food";
  add(F, "friday-dinner", "Friday dinner sorted", "Eat before 6 pm, or plan a pickup with your car.");
  add(F, "snacks", "Snacks for the drive");
  if (p.dietary.length || p.dietaryNotes.trim()) {
    add(F, "diet-backup", "A few backup snacks that fit your diet", "We'll cook for everyone, but a safety net never hurts.");
  }
  if (p.optInBooze) add(F, "id", "ID");

  const X = "Extras";
  if (p.hasCar) add(X, "car-ready", "Car fuelled up and trunk cleared");
  for (const [key, n] of Object.entries(p.extras)) {
    if (n > 0) add(X, `extra-${key}`, `Spare ${key.replace(/([A-Z])/g, " $1").toLowerCase()} ×${n} for the group`);
  }
  if (p.bringing.trim()) add(X, "bringing", `Your contribution: ${p.bringing.trim()}`);
  add(X, "chunder", "A sense of adventure", "Non-negotiable.");

  return items;
}
