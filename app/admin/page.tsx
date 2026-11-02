import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db, ownerPhones } from "@/lib/db";
import { computeLogistics } from "@/lib/logistics";
import { TRIP } from "@/lib/trip";
import { addAdmin, removeAdmin, removePerson } from "@/app/actions";
import TabBar from "@/components/TabBar";
import AssignSelect from "@/components/AssignSelect";
import CopyButton from "@/components/CopyButton";
import ConfirmButton from "@/components/ConfirmButton";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

const short = (area: string) => area.replace(/^SF · /, "");
const tone = (gap: number) => (gap >= 0 ? "ok" : gap >= -2 ? "warn" : "bad");
const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

export default async function AdminPage() {
  const { phone: me } = await requireAdmin();
  const all = await db.listProfiles();
  const L = computeLogistics(all);
  const owners = ownerPhones();
  const admins = [...new Set([...owners, ...(await db.listAdmins())])];
  const nameOf = new Map(all.map((p) => [p.phone, p.name || p.phone]));

  const riders = L.people.filter((p) => p.travel === "group" && !p.hasCar).sort((a, b) => a.area.localeCompare(b.area));
  const seatGap = L.totalSeats - L.seatsNeeded;
  const sleepCap = L.sleep.domeCap + TRIP.groupSmallTentBeds + L.sleep.spareTentBeds;
  const sleepNeed = L.people.length - L.sleep.ownTents - L.sleep.inCars;
  const bagGap = L.gear.bags.spare - L.gear.bags.need;
  const padGap = L.gear.pads.spare - L.gear.pads.need;
  const driverOptions = L.cars.map((c) => ({ phone: c.driver.phone, label: `${c.driver.name} · ${c.free} free` }));
  const sorted = [...all].sort((a, b) => (a.name || "~").localeCompare(b.name || "~"));
  const ownWay = L.people.filter((p) => p.travel === "own-way");

  const stats: { v: string | number; l: string; t?: string }[] = [
    { v: `${L.people.length}/${TRIP.rsvps}`, l: `signed up${L.pending.length ? `, ${L.pending.length} part-way` : ""}`, t: L.people.length >= TRIP.rsvps ? "ok" : undefined },
    { v: `${L.cars.length}`, l: `cars, ${L.totalSeats} seats` },
    { v: signed(seatGap), l: `seats vs ${L.seatsNeeded} riding with the group`, t: tone(seatGap) },
    { v: L.unassigned.length, l: "riders without a car yet", t: L.unassigned.length ? "warn" : "ok" },
    { v: signed(sleepCap - sleepNeed), l: `tent beds (${sleepCap}) vs people (${sleepNeed})`, t: tone(sleepCap - sleepNeed) },
    { v: signed(bagGap), l: `bags: ${L.gear.bags.need} needed, ${L.gear.bags.spare} spare`, t: tone(bagGap) },
    { v: signed(padGap), l: `pads: ${L.gear.pads.need} needed, ${L.gear.pads.spare} spare`, t: tone(padGap) },
    { v: `$${L.money.foodTotal + L.money.boozeTotal}`, l: `$${L.money.foodTotal} food, $${L.money.boozeTotal} booze` },
  ];

  return (
    <>
      <header className="topline"><Link href="/" className="brand">Chunderdome <span>II</span></Link><span className="mono faint">Admin</span></header>
      <main className="page wide">
        <section className="block" style={{ borderTop: 0 }}>
          <h1 className="d d-l">Logistics</h1>
          <div className="row" style={{ marginTop: 14 }}>
            <CopyButton text={L.people.map((p) => p.phone).join(", ")} label="Copy all numbers" />
            <a className="btn sm ghost" href="/api/export">CSV</a>
          </div>
        </section>

        <div className="stats">
          {stats.map((s) => <div key={s.l} className={s.t}><b>{s.v}</b><span>{s.l}</span></div>)}
        </div>

        <div className="admin-grid">
          <section className="block">
            <div className="block-head"><h2 className="d d-m">Cars</h2><span className="mono faint">{L.cars.length} drivers</span></div>
            {L.cars.length === 0 && <p className="muted">No drivers yet.</p>}
            {L.cars.map((c) => (
              <div className="car" key={c.driver.phone}>
                <div className="row spread">
                  <strong>{c.driver.name}</strong>
                  <span className={`tag ${c.free < 0 ? "bad" : c.free === 0 ? "ok" : ""}`}>{c.free < 0 ? `${-c.free} over` : c.free === 0 ? "Full" : `${c.free} free`}</span>
                </div>
                <div className="hint" style={{ marginTop: 2 }}>{short(c.driver.area)}{c.driver.areaDetail && `, ${c.driver.areaDetail}`}{c.driver.stayLater && " · may stay late"}</div>
                <div className="seats">
                  {Array.from({ length: Math.max(c.seats, c.passengers.length + 1) }).map((_, i) => (
                    <span key={i} className={`seat ${i === 0 ? "driver" : i <= c.passengers.length ? (i < c.seats ? "taken" : "over") : ""}`} />
                  ))}
                </div>
                {c.passengers.length > 0 && <div style={{ fontSize: 15 }}>{c.passengers.map((p) => `${p.name} (${short(p.area)})`).join(", ")}</div>}
                {c.driver.carNotes && <div className="hint">“{c.driver.carNotes}”</div>}
              </div>
            ))}
            {(ownWay.length > 0 || L.lateArrivals.length > 0) && (
              <p className="hint" style={{ marginTop: 14 }}>
                {ownWay.length > 0 && <>Own way: {ownWay.map((p) => p.name).join(", ")}. </>}
                {L.lateArrivals.length > 0 && <>Late: {L.lateArrivals.map((p) => p.name).join(", ")}.</>}
              </p>
            )}
          </section>

          <section className="block">
            <div className="block-head"><h2 className="d d-m">Seat riders</h2><span className="mono faint">{L.unassigned.length} left</span></div>
            {riders.length === 0 ? <p className="muted">Nobody needs a seat yet.</p> : riders.map((p) => (
              <div className="person" key={p.phone}>
                <div className="row spread"><strong>{p.name}</strong>{p.stayLater && <span className="tag">May stay late</span>}</div>
                <div className="hint" style={{ marginTop: 2 }}>{short(p.area)}{p.areaDetail && `, ${p.areaDetail}`}</div>
                <AssignSelect phone={p.phone} current={p.rideWith} drivers={driverOptions} />
              </div>
            ))}
          </section>

          <section className="block">
            <h2 className="d d-m" style={{ marginBottom: 12 }}>By area</h2>
            <ul className="list">
              {L.areas.map(([area, a]) => (
                <li key={area}>
                  <div className="row spread"><strong>{short(area)}</strong><span className="mono">{a.people.length} ppl · {a.seats} seats</span></div>
                  <div className="hint" style={{ marginTop: 2 }}>{a.people.map((p) => p.name + (p.hasCar ? " (car)" : "")).join(", ")}</div>
                </li>
              ))}
            </ul>
          </section>

          <section className="block">
            <h2 className="d d-m" style={{ marginBottom: 12 }}>Sleeping</h2>
            <ul className="list">
              <GapRow label="Sleeping bags" need={L.gear.bags.need} spare={L.gear.bags.spare} who={L.gear.bags.who} />
              <GapRow label="Sleeping pads" need={L.gear.pads.need} spare={L.gear.pads.spare} who={L.gear.pads.who} />
              <li>
                <div className="row spread"><strong>Chunderdome</strong><span className={`tag ${L.sleep.inDome > L.sleep.domeCap ? "bad" : "ok"}`}>{L.sleep.inDome}/{L.sleep.domeCap}</span></div>
                <div className="hint" style={{ marginTop: 2 }}>Group small tents ~{TRIP.groupSmallTentBeds} · spare tents {L.sleep.spareTentBeds} · own tents {L.sleep.ownTents} · cars {L.sleep.inCars}</div>
              </li>
            </ul>
          </section>

          <section className="block">
            <h2 className="d d-m" style={{ marginBottom: 12 }}>Spares offered</h2>
            <ul className="list">
              {L.gear.extras.filter((g) => g.total > 0).map((g) => (
                <li key={g.key}>
                  <div className="row spread"><strong>{g.label}</strong><span className="d d-s">{g.total}</span></div>
                  <div className="hint" style={{ marginTop: 2 }}>{g.owners.map((o) => `${o.name}${o.n > 1 ? ` ×${o.n}` : ""}`).join(", ")}</div>
                </li>
              ))}
              {L.people.some((p) => p.bringing) && (
                <li><strong>Also bringing</strong><div className="hint" style={{ marginTop: 2 }}>{L.people.filter((p) => p.bringing).map((p) => `${p.name}: ${p.bringing}`).join(" · ")}</div></li>
              )}
            </ul>
            {L.gear.extras.every((g) => g.total === 0) && <p className="muted">Nothing offered yet.</p>}
          </section>

          <section className="block">
            <h2 className="d d-m" style={{ marginBottom: 12 }}>Dietary</h2>
            {L.diet.length === 0 && L.dietNotes.length === 0 && <p className="muted">Nothing logged yet.</p>}
            <ul className="list">
              {L.diet.map(([d, names]) => (
                <li key={d}><div className="row spread"><strong>{d}</strong><span className="mono">{names.length}</span></div><div className="hint" style={{ marginTop: 2 }}>{names.join(", ")}</div></li>
              ))}
              {L.dietNotes.map((n) => <li key={n.name}><strong>{n.name}:</strong> {n.note}</li>)}
            </ul>
          </section>
        </div>

        <section className="block">
          <div className="block-head"><h2 className="d d-m">Money</h2><span className="mono faint">{L.money.foodIn} food · {L.money.boozeIn} booze</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Venmo</th><th style={{ textAlign: "right" }}>Owes</th></tr></thead>
              <tbody>
                {L.people.sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
                  <tr key={p.phone}>
                    <td>{p.name}</td>
                    <td>{p.venmo ? <a href={`https://venmo.com/u/${encodeURIComponent(p.venmo)}`} target="_blank" rel="noreferrer">@{p.venmo}</a> : <span className="tag bad">Missing</span>}</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>${(p.agreeFood ? TRIP.foodBudget : 0) + (p.optInBooze ? TRIP.boozeBudget : 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="block">
          <div className="block-head"><h2 className="d d-m">Everyone</h2><span className="mono faint">{all.length} accounts</span></div>
          {sorted.map((p: Profile) => (
            <div className="person" key={p.phone}>
              <div className="row spread">
                <strong>{p.name || <span className="faint">No name yet</span>}</strong>
                {p.onboardedAt ? null : <span className="tag warn">Part-way</span>}
              </div>
              <div className="hint" style={{ marginTop: 2 }}>
                <a href={`sms:${p.phone}`}>{p.phone}</a>
                {p.onboardedAt && <> · {p.hasCar ? `Driving (${p.carSeats})` : p.travel === "group" ? (p.rideWith ? `With ${nameOf.get(p.rideWith)}` : "Needs a seat") : p.travel === "late" ? "Arriving late" : "Own way"}</>}
                {p.onboardedAt && (p.emergencyPhone ? <> · ICE {p.emergencyName} {p.emergencyPhone}</> : <> · <span className="red">no emergency contact</span></>)}
              </div>
              {p.notes && <div style={{ fontSize: 15, marginTop: 4 }}>“{p.notes}”</div>}
              {p.phone !== me && (
                <form action={removePerson} style={{ marginTop: 6 }}>
                  <input type="hidden" name="phone" value={p.phone} />
                  <ConfirmButton label="Remove" confirm={`Remove ${p.name || p.phone}? Their answers will be deleted.`} />
                </form>
              )}
            </div>
          ))}
        </section>

        <section className="block">
          <h2 className="d d-m" style={{ marginBottom: 12 }}>Admins</h2>
          <ul className="list">
            {admins.map((a) => (
              <li key={a} className="row spread">
                <span>{nameOf.get(a) ?? a} <span className="hint">{a}</span></span>
                {owners.includes(a) ? <span className="tag">Owner</span> : a !== me && (
                  <form action={removeAdmin}><input type="hidden" name="phone" value={a} /><button className="linkbtn">Remove</button></form>
                )}
              </li>
            ))}
          </ul>
          <form action={addAdmin} style={{ marginTop: 16 }}>
            <input name="phone" type="tel" placeholder="Phone number" aria-label="Phone number to make admin" required />
            <button className="btn sm" style={{ marginTop: 10 }}>Make admin</button>
          </form>
        </section>
      </main>
      <TabBar admin />
    </>
  );
}

function GapRow({ label, need, spare, who }: { label: string; need: number; spare: number; who: Profile[] }) {
  const gap = spare - need;
  return (
    <li>
      <div className="row spread"><strong>{label}</strong><span className={`tag ${gap >= 0 ? "ok" : "bad"}`}>{gap >= 0 ? "Covered" : `Short ${-gap}`}</span></div>
      <div className="hint" style={{ marginTop: 2 }}>{need} need, {spare} spare{who.length > 0 && `: ${who.map((p) => p.name).join(", ")}`}</div>
    </li>
  );
}
