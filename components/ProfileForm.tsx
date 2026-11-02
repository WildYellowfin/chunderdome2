"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/app/actions";
import { AREAS, DIETARY_OPTIONS, EXTRA_GEAR, MEALS, TRIP } from "@/lib/trip";
import type { Profile } from "@/lib/types";

const STEPS = ["You", "Getting there", "Sleeping", "Gear to share", "Food", "Money"];

function Opt<T extends string>({
  value, current, onPick, title, sub, name,
}: { value: T; current: T; onPick: (v: T) => void; title: string; sub?: string; name: string }) {
  const on = current === value;
  return (
    <label className={`opt radio ${on ? "on" : ""}`}>
      <input type="radio" name={name} checked={on} onChange={() => onPick(value)} />
      <span className="box" aria-hidden />
      <span><span className="t">{title}</span>{sub && <span className="s">{sub}</span>}</span>
    </label>
  );
}

function Tick({ on, onChange, title, sub }: { on: boolean; onChange: (v: boolean) => void; title: React.ReactNode; sub?: string }) {
  return (
    <label className={`opt check ${on ? "on" : ""}`}>
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
      <span className="box" aria-hidden />
      <span><span className="t">{title}</span>{sub && <span className="s">{sub}</span>}</span>
    </label>
  );
}

function Counter({ label, hint, value, onChange }: { label: string; hint?: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="stepper">
      <div>
        <div style={{ fontWeight: 600 }}>{label}</div>
        {hint && <div className="hint" style={{ marginTop: 2 }}>{hint}</div>}
      </div>
      <div className="ctl">
        <button type="button" aria-label={`Fewer ${label}`} onClick={() => onChange(Math.max(0, value - 1))}>−</button>
        <output className={value ? "nz" : ""} aria-live="polite">{value}</output>
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

  const T = (k: keyof Profile) => (v: string) => set(k, v as never);

  return (
    <div className="flow">
      <div className="flow-head">
        <div className="row spread">
          <span className="mono">{String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")} · {STEPS[step]}</span>
          {!firstTime && <a className="mono" href="/me">Cancel</a>}
        </div>
        <div className="flow-bar" aria-hidden>
          {STEPS.map((s, i) => <span key={s} className={i <= step ? "on" : ""} />)}
        </div>
      </div>

      <div className="flow-body">
        {error && <div className="error" role="alert">{error}</div>}

        {step === 0 && (
          <>
            <h2 className="d d-l">Who&apos;s this?</h2>
            <p className="muted">Three minutes, six screens. Then you&apos;re on the manifest.</p>
            <div className="field">
              <label htmlFor="name">Your name</label>
              <input id="name" type="text" value={p.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" placeholder="First and last" />
            </div>
            <div className="field">
              <label htmlFor="area">Where are you leaving from?</label>
              <select id="area" value={p.area} onChange={(e) => set("area", e.target.value)}>
                <option value="">Pick an area</option>
                {AREAS.map((a) => <option key={a}>{a}</option>)}
              </select>
              <div className="hint">No address. This is just for grouping people into cars.</div>
            </div>
            <div className="field">
              <label htmlFor="areaDetail">Nearest cross streets <span className="faint">(optional)</span></label>
              <input id="areaDetail" type="text" value={p.areaDetail} onChange={(e) => set("areaDetail", e.target.value)} placeholder="24th & Valencia" />
            </div>
            <div className="field">
              <span className="label">Emergency contact</span>
              <div className="hint" style={{ marginTop: 0, marginBottom: 8 }}>Signal at the beach is patchy. Hopefully never used.</div>
              <input aria-label="Emergency contact name" type="text" value={p.emergencyName} onChange={(e) => set("emergencyName", e.target.value)} placeholder="Name" style={{ marginBottom: 8 }} />
              <input aria-label="Emergency contact phone" type="tel" value={p.emergencyPhone} onChange={(e) => set("emergencyPhone", e.target.value)} placeholder="Phone" />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="d d-l">Getting there</h2>
            <p className="muted">Cars leave SF at 6 PM Friday. Everyone&apos;s home by 1 PM Sunday.</p>
            <div className="field">
              <span className="label">How are you getting there?</span>
              <div className="opts">
                <Opt name="travel" value="group" current={p.travel} onPick={T("travel")} title="With the group at 6" sub="Riding in someone's car, or driving one" />
                <Opt name="travel" value="own-way" current={p.travel} onPick={T("travel")} title="My own way, same time" />
                <Opt name="travel" value="late" current={p.travel} onPick={T("travel")} title="Arriving late or Saturday" sub="Say when in the last step" />
              </div>
            </div>
            <div className="field">
              <span className="label">Can you drive a car up?</span>
              <div className="opts">
                <Opt name="car" value="yes" current={p.hasCar ? "yes" : "no"} onPick={() => set("hasCar", true)} title="Yes, I have a car and will drive" />
                <Opt name="car" value="no" current={p.hasCar ? "yes" : "no"} onPick={() => set("hasCar", false)} title="No, I need a seat" />
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
                  <label htmlFor="cn">Anything about the car? <span className="faint">(optional)</span></label>
                  <input id="cn" type="text" value={p.carNotes} onChange={(e) => set("carNotes", e.target.value)} placeholder="Big trunk, roof box, leaving at 6:30" />
                </div>
              </>
            )}
            <div className="opts">
              <Tick on={p.stayLater} onChange={(v) => set("stayLater", v)} title="I might stay later on Sunday" sub="We'll try to put you in a car that's staying too." />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="d d-l">Sleeping</h2>
            <p className="muted">The Chunderdome sleeps {TRIP.tentCapacity}, plus a couple of smaller group tents. November nights here hit the mid-40s °F.</p>
            <div className="field">
              <span className="label">Where do you want to sleep?</span>
              <div className="opts">
                <Opt name="sleeping" value="chunderdome" current={p.sleeping} onPick={T("sleeping")} title="In the Chunderdome" />
                <Opt name="sleeping" value="own-tent" current={p.sleeping} onPick={T("sleeping")} title="In my own tent" sub="You bring it, you pitch it" />
                <Opt name="sleeping" value="car" current={p.sleeping} onPick={T("sleeping")} title="In a car" />
                <Opt name="sleeping" value="undecided" current={p.sleeping} onPick={T("sleeping")} title="Wherever there's room" />
              </div>
            </div>
            <div className="field">
              <span className="label">Sleeping bag</span>
              <div className="opts">
                <Opt name="bag" value="bag" current={p.sleepSetup} onPick={T("sleepSetup")} title="I have one" />
                <Opt name="bag" value="blanket" current={p.sleepSetup} onPick={T("sleepSetup")} title="I'll bring warm blankets" />
                <Opt name="bag" value="need" current={p.sleepSetup} onPick={T("sleepSetup")} title="I need to borrow one" />
              </div>
            </div>
            <div className="field">
              <span className="label">Sleeping pad</span>
              <div className="opts">
                <Opt name="pad" value="own" current={p.padSetup} onPick={T("padSetup")} title="I have one" />
                <Opt name="pad" value="need" current={p.padSetup} onPick={T("padSetup")} title="I need to borrow one" />
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="d d-l">Spares to share</h2>
            <p className="muted">Only count what you can bring beyond your own. The group already has the big tent, both coolers, the stove, and cooking gear.</p>
            <div className="opts field">
              {EXTRA_GEAR.map((g) => (
                <Counter key={g.key} label={g.label} hint={g.key === "tent" ? undefined : g.hint} value={p.extras[g.key] || 0} onChange={(n) => setExtra(g.key, n)} />
              ))}
            </div>
            {(p.extras.tent || 0) > 0 && (
              <div className="field">
                <label htmlFor="ts">Each spare tent sleeps</label>
                <input id="ts" type="number" inputMode="numeric" min={1} max={12} value={p.tentSleeps} onChange={(e) => set("tentSleeps", Number(e.target.value))} />
              </div>
            )}
            <div className="field">
              <label htmlFor="br">Bringing anything fun? <span className="faint">(optional)</span></label>
              <input id="br" type="text" value={p.bringing} onChange={(e) => set("bringing", e.target.value)} placeholder="Guitar, frisbee, cards, a kite" />
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="d d-l">Food</h2>
            <p className="muted">Eat before we leave Friday, or grab something on the way with your car. We get in around 7:30 and setting up takes the evening. After that, we cook.</p>
            <ul className="list field">
              {MEALS.map((m) => (
                <li key={m.meal} className="row spread"><span>{m.meal}</span><span className={`tag ${m.provided ? "solid" : ""}`}>{m.provided ? "Provided" : "On you"}</span></li>
              ))}
            </ul>
            <div className="field">
              <span className="label">Dietary needs</span>
              <div className="chips">
                {DIETARY_OPTIONS.map((d) => {
                  const on = p.dietary.includes(d);
                  return (
                    <button type="button" key={d} className="chip" aria-pressed={on}
                      onClick={() => set("dietary", on ? p.dietary.filter((x) => x !== d) : [...p.dietary, d])}>{d}</button>
                  );
                })}
              </div>
            </div>
            <div className="field">
              <label htmlFor="dn">Anything else the cooks should know? <span className="faint">(optional)</span></label>
              <textarea id="dn" value={p.dietaryNotes} onChange={(e) => set("dietaryNotes", e.target.value)} placeholder="Severe allergies, where your EpiPen lives" />
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h2 className="d d-l">Money</h2>
            <p className="muted">We buy food together and send Venmo requests after the trip.</p>
            <div className="field">
              <label htmlFor="venmo">Venmo username</label>
              <input id="venmo" type="text" value={p.venmo} onChange={(e) => set("venmo", e.target.value)} placeholder="@your-name" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
            </div>
            <div className="opts field">
              <Tick on={p.agreeFood} onChange={(v) => set("agreeFood", v)} title={`I'm in for $${TRIP.foodBudget} for food`} sub="Two breakfasts, Saturday lunch, Saturday dinner" />
              <Tick on={p.optInBooze} onChange={(v) => set("optInBooze", v)} title={`Add $${TRIP.boozeBudget} for the booze kitty`} sub="Optional. Skip it if you're bringing your own or not drinking." />
            </div>
            <div className="field">
              <label htmlFor="notes">Anything else? <span className="faint">(optional)</span></label>
              <textarea id="notes" value={p.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Arriving Saturday at noon, need to leave early" />
            </div>
          </>
        )}
      </div>

      <div className="flow-foot">
        {step > 0 && <button type="button" className="btn ghost" onClick={() => { setError(null); setStep(step - 1); window.scrollTo({ top: 0 }); }}>Back</button>}
        {step < STEPS.length - 1
          ? <button type="button" className="btn" onClick={next}>Next</button>
          : <button type="button" className="btn" onClick={submit} disabled={pending}>{pending ? "Saving" : firstTime ? "I'm in" : "Save"}</button>}
      </div>
    </div>
  );
}
