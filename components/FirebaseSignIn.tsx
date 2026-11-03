"use client";
import { useRef, useState } from "react";
import type { Auth, ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { firebaseSignIn } from "@/app/actions";
import { normalizePhone } from "@/lib/phone";
import type { FirebaseWebConfig } from "@/lib/auth";

const BAD_NUMBER = "That doesn't look like a phone number. Try something like (415) 555-0123.";
const NO_TEXT = "Couldn't send a text to that number. Double-check it?";
const BAD_CODE = "That code didn't work. Try again, or resend.";
const NOT_SET_UP = "Sign-in isn't set up yet. Tell the organiser.";
const RELOAD = "Something went wrong. Reload the page and try again.";

const ERRORS: Record<string, string> = {
  "auth/invalid-phone-number": BAD_NUMBER,
  "auth/missing-phone-number": BAD_NUMBER,
  "auth/too-many-requests": NO_TEXT,
  "auth/invalid-verification-code": BAD_CODE,
  "auth/missing-verification-code": BAD_CODE,
  "auth/code-expired": BAD_CODE,
  "auth/captcha-check-failed": RELOAD,
  "auth/network-request-failed": RELOAD,
  "auth/operation-not-allowed": NOT_SET_UP,
  "auth/billing-not-enabled": NOT_SET_UP,
  "auth/quota-exceeded": NOT_SET_UP,
  "auth/unauthorized-domain": NOT_SET_UP,
  "auth/invalid-app-credential": NOT_SET_UP,
};
const explain = (e: unknown, fallback: string) => ERRORS[(e as { code?: string })?.code ?? ""] ?? fallback;

// Firebase texts the code and checks it here in the browser; the server then
// verifies the ID token Google signs and signs us in as the number inside it.
export default function FirebaseSignIn({ config }: { config: FirebaseWebConfig }) {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [typed, setTyped] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const captchaBox = useRef<HTMLDivElement>(null);
  const auth = useRef<Auth | null>(null);
  const verifier = useRef<RecaptchaVerifier | null>(null);
  const confirmation = useRef<ConfirmationResult | null>(null);

  async function firebaseAuth() {
    if (auth.current) return auth.current;
    const [{ getApps, initializeApp }, { getAuth }] = await Promise.all([import("firebase/app"), import("firebase/auth")]);
    const app = getApps()[0] ?? initializeApp(config);
    auth.current = getAuth(app);
    auth.current.useDeviceLanguage();
    return auth.current;
  }

  // A fresh invisible reCAPTCHA for every attempt, so a retry never reuses a spent one.
  function resetCaptcha() {
    verifier.current?.clear();
    verifier.current = null;
    captchaBox.current?.replaceChildren();
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    const e164 = normalizePhone(typed);
    if (!e164) return setError(BAD_NUMBER);
    setError(null);
    setPending(true);
    try {
      const a = await firebaseAuth();
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import("firebase/auth");
      resetCaptcha();
      const holder = document.createElement("div");
      captchaBox.current!.appendChild(holder);
      verifier.current = new RecaptchaVerifier(a, holder, { size: "invisible" });
      confirmation.current = await signInWithPhoneNumber(a, e164, verifier.current);
      setPhone(e164);
      setStep("code");
    } catch (err) {
      console.error("Firebase send failed", (err as { code?: string })?.code ?? err);
      resetCaptcha();
      setError(explain(err, NO_TEXT));
    } finally {
      setPending(false);
    }
  }

  async function checkCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") || "").trim();
    if (!code || !confirmation.current) return setError(BAD_CODE);
    setError(null);
    setPending(true);
    try {
      const cred = await confirmation.current.confirm(code);
      const token = await cred.user.getIdToken();
      const { signOut } = await import("firebase/auth");
      await signOut(await firebaseAuth()); // our own session cookie takes over from here
      const res = await firebaseSignIn(token);
      if (res?.error) setError(res.error);
    } catch (err) {
      console.error("Firebase confirm failed", (err as { code?: string })?.code ?? err);
      setError(explain(err, BAD_CODE));
    } finally {
      setPending(false);
    }
  }

  function startOver() {
    resetCaptcha();
    confirmation.current = null;
    setError(null);
    setStep("phone");
  }

  return (
    <>
      <div ref={captchaBox} />
      {step === "phone" ? (
        <form onSubmit={sendCode}>
          {error && <div className="error">{error}</div>}
          <div className="field">
            <label htmlFor="phone">Your phone number</label>
            <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="(415) 555-0123" value={typed} onChange={(e) => setTyped(e.target.value)} required />
          </div>
          <button className="btn block-btn" disabled={pending}>{pending ? "One sec" : "Text me a code"}</button>
        </form>
      ) : (
        <form onSubmit={checkCode}>
          {error && <div className="error">{error}</div>}
          <div className="field">
            <label htmlFor="code">6-digit code</label>
            <input id="code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={8} required autoFocus />
            <div className="hint">Sent to {phone}.</div>
          </div>
          <button className="btn block-btn" disabled={pending}>{pending ? "Checking" : "Sign in"}</button>
          <p className="hint" style={{ marginTop: 20 }}><button type="button" className="linkish" onClick={startOver}>Wrong number, or no code? Start over.</button></p>
        </form>
      )}
    </>
  );
}
