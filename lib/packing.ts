import type { Profile } from "./types";
import { BRING_GEAR, LEND_GEAR } from "./trip";

export interface PackItem {
  id: string;
  label: string;
  hint?: string;
  section: string;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : `${many} (${n})`);

// Built from your answers: only gear you said you have, plus the things people
// tend to forget. Everyone's an adult; we don't list beanies.
export function packingList(p: Profile): PackItem[] {
  const items: PackItem[] = [];
  const add = (section: string, id: string, label: string, hint?: string) => items.push({ section, id, label, hint });

  const S = "Sleep";
  if (p.sleepSetup === "bag") add(S, "sleeping-bag", "Sleeping bag");
  if (p.sleepSetup === "blanket") add(S, "blanket", "Warm blankets");
  if (p.sleepSetup === "need") add(S, "borrow-bag", "Sleeping bag: borrowing one");
  if (p.padSetup === "own") add(S, "pad", "Sleeping pad");
  else add(S, "borrow-pad", "Sleeping pad: borrowing one");
  add(S, "pillow", "Pillow");

  const E = "Easy to forget";
  add(E, "clothes", "Clothes for 2 days, including warm gear");
  add(E, "swim", "Swim gear");
  add(E, "sunglasses", "Sunglasses");
  add(E, "sunscreen", "Sunscreen");
  add(E, "towel", "Towel");
  add(E, "toiletries", "Toiletries");
  add(E, "meds", "Any meds you take");
  add(E, "mess-kit", "Mug, plate, bowl, and utensils");
  if (p.optInBooze) add(E, "id", "ID");

  const G = "Gear you said you'd bring";
  for (const g of BRING_GEAR) {
    const n = p.extras[g.key] || 0;
    if (n > 0) add(G, `bring-${g.key}`, plural(n, g.label.replace(/s$/, "").replace(/es$/, ""), g.label));
  }

  const L = "To lend";
  for (const g of LEND_GEAR) {
    const n = p.extras[g.key] || 0;
    if (n > 0) add(L, `lend-${g.key}`, n === 1 ? `Spare ${g.label.toLowerCase().replace(/s$/, "")}` : `Spare ${g.label.toLowerCase()} (${n})`);
  }
  p.tents.forEach((sleeps, i) => add(L, `lend-tent-${i}`, `Tent for ${sleeps}`));

  const D = "Friday";
  add(D, "friday-dinner", "Eat before 6 PM");

  return items;
}
