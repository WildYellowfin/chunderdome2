"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/app/actions";
import { AREAS, DIETARY_OPTIONS, EXTRA_GEAR, MEALS, TRIP } from "@/lib/trip";
import type { Profile } from "@/lib/types";

const STEPS = ["You", "Getting there", "Sleeping", "Gear to share", "Food", "Money"];

function Choice<T extends string>({
  value, current, onPick, big, title, sub, name,
}: { value: T; current: T; onPick: (v: T) => void; big?: string; title: string; sub?: string; name: string }) {
  return (
    <label className={`choice ${current === value ? "on" : ""}`}>
      <input type="radio" name={name} checked={current === value} onChange={() => onPick(value)} />
      {big && <span className="big" aria-hidden>{big}</span>}
      {title}
      {sub && <small className="muted">{sub}</small>}
    </label>
  );
}

function Counter({ label, hint, value, onChange }: { label: string; hint?: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="counter">
      <div>
        <div>{label}</div>
        {hint && <div className="hint">{hint}</div>}
      </div>
      <div className="ctl">
        <button type="button" aria-label={`Fewer ${label}`} onClick={() => onChange(Math.max(0, value - 1))}>−</button>
        <output aria-live="polite">{value}</output>
        <button type="button" aria-label={`More ${label}`} onClick={() => onChange(Math.min(20, value + 1))}>+</button>
      </div>
    </div>
  );
}

export default function ProfileForm({ initial, firstTime }: { initial: Profile; firstTime: boolean }) {
  const router = useRouter();
  const [p, setP] = useState<Profile>(initial);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }));
  const setExtra = (k: string, n: number) => setP((x) => ({ ...x, extras: { ...x.extras, [k]: n } }));

  function validate(s: number): string | null {
    if (s === 0 && !p.name.trim()) return "What should we call you?";
    if (s === 0 && !p.area) return "Pick roughly where you'll be leaving from.";
    if (s === 5 && !p.venmo.trim()) return "Add your Venmo username.";
    if (s === 5 && !p.agreeFood) return `Tick the $${TRIP.foodBudget} food budget box so we can feed you.`;
    return null;
  }

  function next() {
    const e = validate(step);
    setError(e);
    if (!e) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function submit() {
    const e = validate(0) ?? validate(5);
    if (e) return setError(e);
    start(async () => {
      const res = await saveProfile(p);
      if (res.error) return setError(res.error);
      router.push(firstTime ? "/?welcome=1" : "/");
      router.refresh();
    });
  }

  return (
    <div className="card">
      <div className="kicker">Step {step + 1} of {STEPS.length} · {STEPS[step]}</div>
      <div className="steps" aria-hidden>
        {STEPS.map((s, i) => <span key={s} className={i <= step ? "on" : ""} />)}
      </div>
      {error && <div className="error" role="alert">{error}</div>}

      {step === 0 && (
        <>
          <h2>Who&apos;s this?</h2>
          <div className="field">
            <label htmlFor="name">Your name</label>
            <input id="name" type="text" value={p.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" placeholder="First and last" />
          </div>
          <div className="field">
            <label htmlFor="area">Where will you be leaving from?</label>
            <select id="area" value={p.area} onChange={(e) => set("area", e.target.value)}>
              <option value="">Pick an area…</option>
              {AREAS.map((a) => <option key={a}>{a}</option>)}
            </select>
            <div className="hint">No address needed. We just use this to group people into cars.</div>
          </div>
          <div className="field">
            <label htmlFor="areaDetail">Nearest cross streets or landmark <span className="muted">(optional)</span></label>
            <input id="areaDetail" type="text" value={p.areaDetail} onChange={(e) => set("areaDetail", e.target.value)} placeholder="e.g. 24th & Valencia, or near Dolores Park" />
          </div>
          <h3 style={{ marginTop: 24 }}>Emergency contact</h3>
          <p className="hint">Hopefully we never use it. Cell signal at the beach is patchy.</p>
          <div className="grid">
            <div className="field">
              <label htmlFor="en">Name</label>
              <input id="en" type="text" value={p.emergencyName} onChange={(e) => set("emergencyName", e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="ep">Phone</label>
              <input id="ep" type="tel" value={p.emergencyPhone} onChange={(e) => set("emergencyPhone", e.target.value)} />
            </div>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <h2>Getting there</h2>
          <p className="muted">Cars leave SF at <b>6 pm Friday</b> and we&apos;re back by <b>1 pm Sunday</b>.</p>
          <div className="field">
            <label>How are you getting there?</label>
            <div className="choices">
              <Choice name="travel" value="group" current={p.travel} onPick={(v) => set("travel", v)} big="🚗" title="With the group at 6" sub="In someone's car, or driving one" />
              <Choice name="travel" value="own-way" current={p.travel} onPick={(v) => set("travel", v)} big="🧭" title="My own way, same time" sub="Coming from elsewhere" />
              <Choice name="travel" value="late" current={p.travel} onPick={(v) => set("travel", v)} big="🌙" title="Arriving late / Saturday" sub="Tell us when in the notes" />
            </div>
          </div>
          <div className="field">
            <label>Do you have a car you&apos;d be willing to drive up?</label>
            <div className="choices">
              <label className={`choice ${p.hasCar ? "on" : ""}`}>
                <input type="radio" name="car" checked={p.hasCar} onChange={() => set("hasCar", true)} />
                <span className="big" aria-hidden>🙋</span>Yes, I can drive
              </label>
              <label className={`choice ${!p.hasCar ? "on" : ""}`}>
                <input type="radio" name="car" checked={!p.hasCar} onChange={() => set("hasCar", false)} />
                <span className="big" aria-hidden>🎒</span>No, I need a ride
              </label>
            </div>
          </div>
          {p.hasCar && (
            <>
              <div className="field">
                <label htmlFor="seats">Total seats, including yours</label>
                <select id="seats" value={p.carSeats || 5} onChange={(e) => set("carSeats", Number(e.target.value))}>
                  {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>{n} seats ({n - 1} passengers)</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="cn">Anything about the car? <span className="muted">(optional)</span></label>
                <input id="cn" type="text" value={p.carNotes} onChange={(e) => set("carNotes", e.target.value)} placeholder="Huge trunk, roof rack, can't leave until 6:30…" />
              </div>
            </>
          )}
          <label className="check" style={{ borderTop: 0 }}>
            <input type="checkbox" checked={p.stayLater} onChange={(e) => set("stayLater", e.target.checked)} />
            <span className="lbl">I might want to stay later on Sunday<br /><small className="muted">We&apos;ll try to put you in a car that&apos;s staying too.</small></span>
          </label>
        </>
      )}

      {step === 2 && (
        <>
          <h2>Sleeping</h2>
          <p className="muted">The Chunderdome sleeps {TRIP.tentCapacity}. We also have a couple of smaller tents. November nights here get down to the mid-40s °F.</p>
          <div className="field">
            <label>Where do you want to sleep?</label>
            <div className="choices">
              <Choice name="sleeping" value="chunderdome" current={p.sleeping} onPick={(v) => set("sleeping", v)} big="⛺" title="In the Chunderdome" sub="Where the magic happens" />
              <Choice name="sleeping" value="own-tent" current={p.sleeping} onPick={(v) => set("sleeping", v)} big="🏕️" title="I'll bring my own tent" />
              <Choice name="sleeping" value="car" current={p.sleeping} onPick={(v) => set("sleeping", v)} big="🚙" title="In a car" />
              <Choice name="sleeping" value="undecided" current={p.sleeping} onPick={(v) => set("sleeping", v)} big="🤷" title="Wherever there's room" />
            </div>
          </div>
          <div className="field">
            <label>Sleeping bag?</label>
            <div className="choices">
              <Choice name="bag" value="bag" current={p.sleepSetup} onPick={(v) => set("sleepSetup", v)} title="I have a sleeping bag" />
              <Choice name="bag" value="blanket" current={p.sleepSetup} onPick={(v) => set("sleepSetup", v)} title="I'll bring warm blankets" />
              <Choice name="bag" value="need" current={p.sleepSetup} onPick={(v) => set("sleepSetup", v)} title="I need to borrow one" />
            </div>
          </div>
          <div className="field">
            <label>Sleeping pad?</label>
            <div className="choices">
              <Choice name="pad" value="own" current={p.padSetup} onPick={(v) => set("padSetup", v)} title="I have a pad" />
              <Choice name="pad" value="need" current={p.padSetup} onPick={(v) => set("padSetup", v)} title="I need to borrow one" />
            </div>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h2>Got spares to share?</h2>
          <p className="muted">Count only things you can bring <b>beyond</b> what you&apos;ll use yourself. The group already has the big tent, coolers, stove, and cooking gear.</p>
          <div className="field">
            {EXTRA_GEAR.map((g) => (
              <Counter key={g.key} label={g.label} hint={g.hint} value={p.extras[g.key] || 0} onChange={(n) => setExtra(g.key, n)} />
            ))}
          </div>
          {(p.extras.tent || 0) > 0 && (
            <div className="field">
              <label htmlFor="ts">How many people does each spare tent sleep?</label>
              <input id="ts" type="number" min={1} max={12} value={p.tentSleeps} onChange={(e) => set("tentSleeps", Number(e.target.value))} />
            </div>
          )}
          <div className="field">
            <label htmlFor="br">Bringing anything else fun or useful? <span className="muted">(optional)</span></label>
            <input id="br" type="text" value={p.bringing} onChange={(e) => set("bringing", e.target.value)} placeholder="Guitar, frisbee, card games, a kite, telescope…" />
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <h2>Food</h2>
          <div className="card flat" style={{ background: "var(--sand)", marginBottom: 18 }}>
            <p><b>The plan:</b> eat dinner before we leave Friday, or grab something on the way with your car. We get in around 7:30 and setting up eats the evening.</p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {MEALS.map((m) => <li key={m.meal}>{m.meal}: {m.provided ? <b>provided</b> : <span className="muted">{m.note}</span>}</li>)}
            </ul>
          </div>
          <div className="field">
            <label>Any dietary needs?</label>
            <div className="row">
              {DIETARY_OPTIONS.map((d) => {
                const on = p.dietary.includes(d);
                return (
                  <button type="button" key={d} className={`pill ${on ? "sea" : ""}`} style={{ border: 0, cursor: "pointer", padding: "6px 12px", fontSize: "0.9rem" }}
                    aria-pressed={on}
                    onClick={() => set("dietary", on ? p.dietary.filter((x) => x !== d) : [...p.dietary, d])}>
                    {on ? "✓ " : ""}{d}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="field">
            <label htmlFor="dn">Anything else the cooks should know? <span className="muted">(optional)</span></label>
            <textarea id="dn" value={p.dietaryNotes} onChange={(e) => set("dietaryNotes", e.target.value)} placeholder="Severe allergies, strong dislikes, epipen location…" />
          </div>
        </>
      )}

      {step === 5 && (
        <>
          <h2>Money stuff</h2>
          <p className="muted">We&apos;ll buy food together and send Venmo requests after the trip.</p>
          <div className="field">
            <label htmlFor="venmo">Venmo username</label>
            <input id="venmo" type="text" value={p.venmo} onChange={(e) => set("venmo", e.target.value)} placeholder="@your-name" autoCapitalize="off" autoCorrect="off" />
          </div>
          <label className={`check ${p.agreeFood ? "" : ""}`} style={{ borderTop: 0 }}>
            <input type="checkbox" checked={p.agreeFood} onChange={(e) => set("agreeFood", e.target.checked)} />
            <span className="lbl"><b>I&apos;m in for ${TRIP.foodBudget} for food.</b><br /><small className="muted">Covers two breakfasts, Saturday lunch, and Saturday dinner.</small></span>
          </label>
          <label className="check">
            <input type="checkbox" checked={p.optInBooze} onChange={(e) => set("optInBooze", e.target.checked)} />
            <span className="lbl"><b>Count me in for ${TRIP.boozeBudget} for the group booze kitty.</b><br /><small className="muted">Optional. Skip it if you&apos;re bringing your own or not drinking.</small></span>
          </label>
          <div className="field" style={{ marginTop: 18 }}>
            <label htmlFor="notes">Anything else we should know? <span className="muted">(optional)</span></label>
            <textarea id="notes" value={p.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Arriving Saturday at noon, need to leave early, bringing a +1 dog (please no)…" />
          </div>
        </>
      )}

      <div className="row spread" style={{ marginTop: 22 }}>
        {step > 0 ? <button type="button" className="btn ghost" onClick={() => { setError(null); setStep(step - 1); }}>Back</button> : <span />}
        {step < STEPS.length - 1
          ? <button type="button" className="btn" onClick={next}>Next</button>
          : <button type="button" className="btn" onClick={submit} disabled={pending}>{pending ? "Saving…" : firstTime ? "I'm in 🔥" : "Save"}</button>}
      </div>
    </div>
  );
}
