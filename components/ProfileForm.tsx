"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/app/actions";
import { BRING_GEAR, CLAY_HOUSE, DIETARY_OPTIONS, LEND_GEAR, MEALS, RETURN_OPTIONS, SEAT_OPTIONS, TRIP, TRUNK_OPTIONS } from "@/lib/trip";
import type { Profile, Trunk } from "@/lib/types";
import PickupMap from "./PickupMap";

const STEPS = ["You", "Getting there", "Sleeping", "Gear", "Food", "Money"];

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

function Counter({ label, hint, value, onChange, min = 0, max = 20 }: { label: string; hint?: string; value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <div className="stepper">
      <div>
        <div style={{ fontWeight: 600 }}>{label}</div>
        {hint && <div className="hint" style={{ marginTop: 2 }}>{hint}</div>}
      </div>
      <div className="ctl">
        <button type="button" aria-label={`Fewer ${label}`} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>−</button>
        <output className={value ? "nz" : ""} aria-live="polite">{value}</output>
        <button type="button" aria-label={`More ${label}`} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>+</button>
      </div>
    </div>
  );
}

function YesNo({ value, onChange, yes, no, yesSub, noSub }: { value: boolean | null; onChange: (v: boolean) => void; yes: string; no: string; yesSub?: string; noSub?: string }) {
  return (
    <div className="seg two" role="radiogroup">
      <button type="button" role="radio" aria-checked={value === true} onClick={() => onChange(true)}>{yes}{yesSub && <span>{yesSub}</span>}</button>
      <button type="button" role="radio" aria-checked={value === false} onClick={() => onChange(false)}>{no}{noSub && <span>{noSub}</span>}</button>
    </div>
  );
}

function CarSize({ seats, onChange }: { seats: number; onChange: (n: number) => void }) {
  const preset = (SEAT_OPTIONS as readonly number[]).includes(seats);
  const [other, setOther] = useState(!preset);
  return (
    <>
      <div className="seg four" role="radiogroup" aria-label="Seats">
        {SEAT_OPTIONS.map((n) => (
          <button key={n} type="button" role="radio" aria-checked={!other && seats === n} onClick={() => { setOther(false); onChange(n); }}>
            <b>{n}</b><span>seater</span>
          </button>
        ))}
        <button type="button" role="radio" aria-checked={other} onClick={() => { setOther(true); if (preset) onChange(4); }}>
          <b>…</b><span>other</span>
        </button>
      </div>
      {other && (
        <div className="opts" style={{ marginTop: 10 }}>
          <Counter label="Seats, including yours" value={seats} onChange={onChange} min={2} max={12} />
        </div>
      )}
    </>
  );
}

function TrunkSlider({ value, onChange }: { value: Trunk; onChange: (v: Trunk) => void }) {
  return (
    <div className="trunk">
      <div className="trunk-now">
        <TrunkIcon level={value} />
        <strong>{TRUNK_OPTIONS[value]}</strong>
      </div>
      <input
        type="range" min={0} max={2} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value) as Trunk)}
        aria-label="Trunk space with the car full"
        aria-valuetext={TRUNK_OPTIONS[value]}
        style={{ "--fill": `${value * 50}%` } as React.CSSProperties}
      />
      <div className="trunk-ends mono faint"><span>Tight</span><span>Roomy</span></div>
    </div>
  );
}

function TrunkIcon({ level }: { level: Trunk }) {
  // Bags stacked in an open trunk: one, three, or five of them.
  const bags = [
    [6, 22, 10, 10], [18, 18, 14, 14], [34, 24, 9, 8], [8, 8, 16, 12], [26, 6, 14, 10],
  ].slice(0, [1, 3, 5][level]);
  return (
    <svg viewBox="0 0 52 36" width="52" height="36" aria-hidden>
      <path d="M2 34h48V14l-6-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M2 34V14" stroke="currentColor" strokeWidth="2.5" />
      {bags.map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={i % 2 ? "var(--ochre)" : "var(--red)"} stroke="currentColor" strokeWidth="2" />
      ))}
    </svg>
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
  const setTents = (t: number[]) => set("tents", t);
  // First time through, eating and drinking start unanswered so everyone picks one on purpose.
  const [eatPicked, setEatPicked] = useState(!firstTime);
  const [drinkPicked, setDrinkPicked] = useState(!firstTime);

  function validate(s: number): string | null {
    if (s === 0 && !p.name.trim()) return "What should we call you?";
    if (s === 0 && !p.pickup) return "Drag the map to drop your pin.";
    if (s === 1 && p.returnPref === "earlier" && !p.returnBy) return "What time do you need to be back on Sunday?";
    if (s === 5 && !eatPicked) return "Are you eating with us?";
    if (s === 5 && !drinkPicked) return "Are you drinking with us?";
    return null;
  }

  function go(to: number) {
    setError(null);
    setStep(to);
    window.scrollTo({ top: 0 });
  }

  function next() {
    const e = validate(step);
    setError(e);
    if (!e) go(step + 1);
  }

  function submit() {
    for (const s of [0, 1, 5]) {
      const e = validate(s);
      if (e) { setError(e); if (s !== step) setStep(s); return; }
    }
    start(async () => {
      const res = await saveProfile(p);
      if (res.error) return setError(res.error);
      router.push(firstTime ? "/?welcome=1" : "/");
      router.refresh();
    });
  }

  const owesFood = p.hasCar || !p.agreeFood ? 0 : TRIP.foodBudget;

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
            <div className="field" style={{ marginTop: 18 }}>
              <label htmlFor="name">Your name</label>
              <input id="name" type="text" value={p.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" placeholder="First and last" />
            </div>
            <div className="field">
              <span className="label">Where should we pick you up?</span>
              <div className="hint" style={{ marginTop: 0, marginBottom: 10 }}>Cars gather at {CLAY_HOUSE.name} ({CLAY_HOUSE.address}).</div>
              <PickupMap value={p.pickup} onChange={(v, area) => setP((x) => ({ ...x, pickup: v, area }))} />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="d d-l">Getting there</h2>
            <p className="muted">Cars leave at 6 PM Friday. Back by 1 PM Sunday.</p>
            <div className="field">
              <span className="label">Do you have a car you&apos;re willing to drive?</span>
              <YesNo value={p.hasCar} onChange={(v) => setP((x) => ({ ...x, hasCar: v, carSeats: v && x.carSeats < 2 ? 5 : x.carSeats }))} yes="Yes, I'll drive" no="No car" />
              <div className="hint">Drivers eat for free.</div>
            </div>
            {p.hasCar && (
              <>
                <div className="field">
                  <span className="label">How big is it?</span>
                  <CarSize seats={p.carSeats} onChange={(n) => set("carSeats", n)} />
                </div>
                <div className="field">
                  <span className="label">Trunk space with the car full</span>
                  <TrunkSlider value={p.trunk} onChange={(v) => set("trunk", v)} />
                </div>
              </>
            )}
            <div className="field">
              <span className="label">Getting home on Sunday</span>
              <div className="opts">
                {RETURN_OPTIONS.map((o) => (
                  <Opt key={o.value} name="ret" value={o.value} current={p.returnPref} onPick={(v) => set("returnPref", v)} title={o.title} />
                ))}
              </div>
              {p.returnPref === "earlier" && (
                <div className="backby">
                  <label htmlFor="rb">Back in SF by</label>
                  <input id="rb" type="time" value={p.returnBy} min="06:00" max="13:00" step={900} onChange={(e) => set("returnBy", e.target.value)} />
                </div>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="d d-l">Sleeping</h2>
            <p className="muted">It could be as cold as the mid-40s.</p>
            <div className="field">
              <span className="label">Sleeping bag</span>
              <div className="opts">
                <Opt name="bag" value="bag" current={p.sleepSetup} onPick={(v) => set("sleepSetup", v)} title="I have one" />
                <Opt name="bag" value="blanket" current={p.sleepSetup} onPick={(v) => set("sleepSetup", v)} title="I'll bring warm blankets" />
                <Opt name="bag" value="need" current={p.sleepSetup} onPick={(v) => set("sleepSetup", v)} title="I need to borrow one" />
              </div>
            </div>
            <div className="field">
              <span className="label">Sleeping pad</span>
              <div className="opts">
                <Opt name="pad" value="own" current={p.padSetup} onPick={(v) => set("padSetup", v)} title="I have one" />
                <Opt name="pad" value="need" current={p.padSetup} onPick={(v) => set("padSetup", v)} title="I need to borrow one" />
              </div>
            </div>

            <h3 className="d d-m section-h">Extra gear</h3>
            <p className="muted">Do you have extra gear you don&apos;t mind lending to fellow chunderdomers?</p>
            <div className="opts field">
              {LEND_GEAR.map((g) => (
                <Counter key={g.key} label={g.label} value={p.extras[g.key] || 0} onChange={(n) => setExtra(g.key, n)} />
              ))}
              {p.tents.map((sleeps, i) => (
                <div className="stepper tent" key={i}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Tent {p.tents.length > 1 ? i + 1 : ""}</div>
                    <button type="button" className="linkbtn hint" onClick={() => setTents(p.tents.filter((_, j) => j !== i))}>Remove</button>
                  </div>
                  <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
                    <span className="mono faint">Sleeps</span>
                    <div className="ctl">
                      <button type="button" aria-label="Sleeps fewer" onClick={() => setTents(p.tents.map((t, j) => (j === i ? Math.max(1, t - 1) : t)))}>−</button>
                      <output className="nz">{sleeps}</output>
                      <button type="button" aria-label="Sleeps more" onClick={() => setTents(p.tents.map((t, j) => (j === i ? Math.min(12, t + 1) : t)))}>+</button>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="add-row" onClick={() => setTents([...p.tents, 2])}>
                <span aria-hidden>+</span> {p.tents.length ? "Another tent" : "I have a tent to lend"}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="d d-l">Gear</h2>
            <p className="muted">How many are you bringing, counting your own? The group already has the big tent, coolers, stove, and cooking gear.</p>
            <div className="opts field">
              {BRING_GEAR.map((g) => (
                <Counter key={g.key} label={g.label} hint={g.hint} value={p.extras[g.key] || 0} onChange={(n) => setExtra(g.key, n)} />
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="d d-l">Food</h2>
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
              <textarea id="dn" value={p.dietaryNotes} onChange={(e) => set("dietaryNotes", e.target.value)} />
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h2 className="d d-l">Money</h2>
            <div className="bill field">
              <div className="bill-row">
                <span>Food<span className="s">{p.hasCar ? "Free for drivers" : "Two breakfasts, Saturday lunch and dinner"}</span></span>
                {!p.agreeFood ? <b className="bill-v">—</b> : p.hasCar ? <span className="bill-v"><s>${TRIP.foodBudget}</s> <b>Free</b></span> : <b className="bill-v">${TRIP.foodBudget}</b>}
              </div>
              <div className="bill-row">
                <span>Fuel and tolls<span className="s">Split evenly across everyone, drivers included</span></span>
                <b className="bill-v">Your share</b>
              </div>
              <div className="bill-row">
                <span>Drinks<span className="s">Optional</span></span>
                <b className="bill-v">{p.optInBooze ? `$${TRIP.boozeBudget}` : "—"}</b>
              </div>
            </div>
            <p className="hint" style={{ marginTop: -10, marginBottom: 18 }}>You can add any group expenses you make on this website, and you&apos;ll be reimbursed.</p>
            <div className="field">
              <span className="label">Eating with us?</span>
              <YesNo value={eatPicked ? p.agreeFood : null} onChange={(v) => { setEatPicked(true); set("agreeFood", v); }}
                yes="I'm in" yesSub={p.hasCar ? "Free for drivers" : `$${TRIP.foodBudget}`} no="I'm out" noSub="$0" />
            </div>
            <div className="field">
              <span className="label">Drinking with us?</span>
              <YesNo value={drinkPicked ? p.optInBooze : null} onChange={(v) => { setDrinkPicked(true); set("optInBooze", v); }}
                yes="I'm in" yesSub={`$${TRIP.boozeBudget}`} no="I'm out" noSub="$0" />
            </div>
            <div className="field">
              <label htmlFor="venmo">Venmo username <span className="faint">(optional)</span></label>
              <input id="venmo" type="text" value={p.venmo} onChange={(e) => set("venmo", e.target.value)} placeholder="@your-name" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
            </div>
            <div className="field">
              <label htmlFor="notes">Anything else? <span className="faint">(optional)</span></label>
              <textarea id="notes" value={p.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
            <p className="faint" style={{ fontSize: 14 }}>Estimated total before fuel and tolls: ${owesFood + (p.optInBooze ? TRIP.boozeBudget : 0)}.</p>
          </>
        )}
      </div>

      <div className="flow-foot">
        {step > 0 && <button type="button" className="btn ghost" onClick={() => go(step - 1)}>Back</button>}
        {step < STEPS.length - 1
          ? <button type="button" className="btn" onClick={next}>Next</button>
          : <button type="button" className="btn" onClick={submit} disabled={pending}>{pending ? "Saving" : firstTime ? "I'm in" : "Save"}</button>}
      </div>
    </div>
  );
}
