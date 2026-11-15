"use client";
import { useActionState } from "react";
import { addExpense, type ExpenseState } from "@/app/actions";

/** One expense at a time: what it was for and how much. Clears itself, ready for the next. */
export default function AddExpense({ first }: { first: boolean }) {
  const [state, action, pending] = useActionState<ExpenseState, FormData>(addExpense, undefined);
  // Keyed on each result so the fields clear after an add and keep what was typed after an error.
  const k = JSON.stringify(state ?? {});
  return (
    <form action={action} className="expense-add">
      {state?.error && <div className="error">{state.error}</div>}
      <div className="expense-fields" key={k}>
        <input name="note" type="text" placeholder="What for, e.g. Safeway groceries" aria-label="What it was for" defaultValue={state?.note} maxLength={80} autoComplete="off" autoFocus={!!state?.added} required />
        <label className="amt-in">
          <span>$</span>
          <input name="amount" type="text" inputMode="decimal" placeholder="0.00" aria-label="Amount in dollars" defaultValue={state?.amount} autoComplete="off" required />
        </label>
        <button className="btn sm" disabled={pending}>{pending ? "Adding" : first ? "Add expense" : "Add another"}</button>
      </div>
    </form>
  );
}
