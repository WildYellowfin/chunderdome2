"use client";
import { useActionState } from "react";
import { addPerson, type AddState } from "@/app/actions";
import { SEAT_CHOICES, seatLabel } from "./CarSelect";

/** Admin: add someone who never signed up, optionally with their car. */
export default function AddPerson() {
  const [state, action, pending] = useActionState<AddState, FormData>(addPerson, undefined);
  // Keyed on each result so the fields reset after an add and keep what was typed after an error.
  const k = JSON.stringify(state ?? {});
  return (
    <form action={action} className="note" style={{ marginBottom: 18 }}>
      <strong>Add someone who didn&apos;t sign up</strong>
      <p className="hint" style={{ margin: "4px 0 12px" }}>They&apos;ll show up in the cars and their carmates will get their number. Signed in but never finished? Use the same number.</p>
      {state?.error && <div className="error">{state.error}</div>}
      {state?.added && <p style={{ fontWeight: 600 }}>{state.added}</p>}
      <div className="stack" key={k}>
        <input name="name" type="text" placeholder="Name" aria-label="Name" defaultValue={state?.name} autoComplete="off" required />
        <input name="phone" type="tel" inputMode="tel" placeholder="Phone, (415) 555-0123" aria-label="Phone number" defaultValue={state?.phone} autoComplete="off" required />
        <select name="seats" aria-label="Car" defaultValue={state?.seats ?? "0"}>
          <option value="0">No car, riding with someone</option>
          {SEAT_CHOICES.map((n) => <option key={n} value={n}>{seatLabel(n)}</option>)}
        </select>
      </div>
      <button className="btn sm" style={{ marginTop: 12 }} disabled={pending}>{pending ? "Adding" : "Add"}</button>
    </form>
  );
}
