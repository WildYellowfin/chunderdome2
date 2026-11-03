"use client";
import { useActionState } from "react";
import { saveCosts, type FormState } from "@/app/actions";

export default function Costs({ driver, fuel, tolls, group }: { driver: boolean; fuel: number; tolls: number; group: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCosts, undefined);
  const amount = (n: number) => (n ? n.toFixed(2) : "");
  return (
    <form action={action} className="note" style={{ marginTop: 16 }}>
      <strong>Group expenses</strong>
      <p className="hint" style={{ margin: "4px 0 12px" }}>You can add any group expenses you make on this website, and you&apos;ll be reimbursed.</p>
      {state?.error && <div className="error">{state.error}</div>}
      <div className="money-in">
        {driver && <label>Fuel<span>$</span><input name="fuel" type="text" inputMode="decimal" defaultValue={amount(fuel)} placeholder="0" /></label>}
        {driver && <label>Tolls<span>$</span><input name="tolls" type="text" inputMode="decimal" defaultValue={amount(tolls)} placeholder="0" /></label>}
        <label>{driver ? "Other" : "Spent"}<span>$</span><input name="group" type="text" inputMode="decimal" defaultValue={amount(group)} placeholder="0" /></label>
      </div>
      <button className="btn sm" style={{ marginTop: 12 }} disabled={pending}>{pending ? "Saving" : "Save"}</button>
    </form>
  );
}
