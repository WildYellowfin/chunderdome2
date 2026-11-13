"use client";
import { setCar } from "@/app/actions";

export const SEAT_CHOICES = [2, 3, 4, 5, 6, 7, 8];
export const seatLabel = (n: number) => `Has a car, ${n} seats with driver`;

/** Admin: give someone a car, change its seats, or take it away. */
export default function CarSelect({ phone, name, seats, riders }: { phone: string; name: string; seats: number; riders: number }) {
  const choices = seats >= 2 && !SEAT_CHOICES.includes(seats) ? [...SEAT_CHOICES, seats].sort((a, b) => a - b) : SEAT_CHOICES;
  return (
    // Keyed on the saved value so React's post-action form reset can't snap it back.
    <form action={setCar} key={seats}>
      <input type="hidden" name="phone" value={phone} />
      <select
        name="seats"
        defaultValue={seats >= 2 ? String(seats) : "0"}
        aria-label={`${name}'s car`}
        onChange={(e) => {
          const el = e.currentTarget;
          if (el.value === "0" && riders > 0 && !window.confirm(`Take away ${name}'s car? The ${riders} ${riders === 1 ? "person" : "people"} riding with them will need a new car.`)) {
            el.value = String(seats);
            return;
          }
          el.form?.requestSubmit();
        }}
      >
        <option value="0">No car</option>
        {choices.map((n) => <option key={n} value={n}>{seatLabel(n)}</option>)}
      </select>
    </form>
  );
}
