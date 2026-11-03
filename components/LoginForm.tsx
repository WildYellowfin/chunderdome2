"use client";
import { useActionState } from "react";
import { startSignIn, verifySignIn, type FormState } from "@/app/actions";

export function PhoneForm({ mode }: { mode: "sms" | "trip-code" | "open" | "closed" }) {
  const [state, action, pending] = useActionState<FormState, FormData>(startSignIn, undefined);
  return (
    <form action={action}>
      {state?.error && <div className="error">{state.error}</div>}
      <div className="field">
        <label htmlFor="phone">Your phone number</label>
        <input key={state?.phone} id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="(415) 555-0123" defaultValue={state?.phone} required />
      </div>
      {mode === "trip-code" && (
        <div className="field">
          <label htmlFor="tripCode">Trip code</label>
          <input id="tripCode" name="tripCode" type="text" autoComplete="off" placeholder="It's in the group chat" required />
        </div>
      )}
      <button className="btn block-btn" disabled={pending}>{pending ? "One sec" : mode === "sms" ? "Text me a code" : "Let me in"}</button>
    </form>
  );
}

export function CodeForm({ phone }: { phone: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(verifySignIn, undefined);
  return (
    <form action={action}>
      {state?.error && <div className="error">{state.error}</div>}
      <input type="hidden" name="phone" value={phone} />
      <div className="field">
        <label htmlFor="code">6-digit code</label>
        <input id="code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={8} required autoFocus />
        <div className="hint">Sent to {phone}.</div>
      </div>
      <button className="btn block-btn" disabled={pending}>{pending ? "Checking" : "Sign in"}</button>
    </form>
  );
}
