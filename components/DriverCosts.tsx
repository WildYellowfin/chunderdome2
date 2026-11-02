"use client";
import { useActionState } from "react";
import { saveDriverCosts, type FormState } from "@/app/actions";

export default function DriverCosts({ fuel, tolls }: { fuel: number; tolls: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveDriverCosts, undefined);
  return (
    <form action={action} className="note" style={{ marginTop: 16 }}>
      <strong>Driver costs</strong>
      <p className="hint" style={{ margin: "4px 0 12px" }}>Add what you spent on fuel and tolls. It gets split across everyone and comes off your total.</p>
      {state?.error && <div className="error">{state.error}</div>}
      <div className="money-in">
        <label>Fuel<span>$</span><input name="fuel" type="text" inputMode="decimal" defaultValue={fuel ? fuel.toFixed(2) : ""} placeholder="0" /></label>
        <label>Tolls<span>$</span><input name="tolls" type="text" inputMode="decimal" defaultValue={tolls ? tolls.toFixed(2) : ""} placeholder="0" /></label>
      </div>
      <button className="btn sm" style={{ marginTop: 12 }} disabled={pending}>{pending ? "Saving" : "Save costs"}</button>
    </form>
  );
}
