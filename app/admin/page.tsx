import { requireAdmin } from "@/lib/auth";
import { db, ownerPhones } from "@/lib/db";
import { computeLogistics } from "@/lib/logistics";
import { TRIP } from "@/lib/trip";
import { addAdmin, removeAdmin, removePerson } from "@/app/actions";
import TopBar from "@/components/TopBar";
import AssignSelect from "@/components/AssignSelect";
import CopyButton from "@/components/CopyButton";
import ConfirmButton from "@/components/ConfirmButton";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

const short = (area: string) => area.replace(/^SF · /, "");
const tone = (gap: number) => (gap >= 0 ? "ok" : gap >= -2 ? "warn" : "bad");

function Stat({ value, label, t }: { value: React.ReactNode; label: string; t?: string }) {
  return <div className={`card stat ${t ?? ""}`}><b>{value}</b><span>{label}</span></div>;
}

export default async function AdminPage() {
  const { phone: me } = await requireAdmin();
  const all = await db.listProfiles();
  const L = computeLogistics(all);
  const admins = [...new Set([...ownerPhones(), ...(await db.listAdmins())])];
  const owners = ownerPhones();
  const nameOf = new Map(all.map((p) => [p.phone, p.name || p.phone]));

  const riders = L.people.filter((p) => p.travel === "group" && !p.hasCar);
  const seatGap = L.totalSeats - L.seatsNeeded;
  const sleepCap = L.sleep.domeCap + TRIP.groupSmallTentBeds + L.sleep.spareTentBeds;
  const sleepNeed = L.people.length - L.sleep.ownTents - L.sleep.inCars;
  const bagGap = L.gear.bags.spare - L.gear.bags.need;
  const padGap = L.gear.pads.spare - L.gear.pads.need;
  const driverOptions = L.cars.map((c) => ({ phone: c.driver.phone, label: `${c.driver.name} (${c.free} free)` }));
  const allPhones = L.people.map((p) => p.phone).join(", ");
  const sorted = [...all].sort((a, b) => (a.name || "~").localeCompare(b.name || "~"));

  return (
    <>
      <TopBar admin />
      <main className="wrap section stack">
        <div className="row spread">
          <div>
            <div className="kicker">Mission control</div>
            <h1 style={{ fontSize: "2.2rem" }}>Admin</h1>
          </div>
          <div className="row">
            <CopyButton text={allPhones} label="Copy all phone numbers" />
            <a className="btn small dark" href="/api/export">Download CSV</a>
          </div>
        </div>

        <div className="grid-tight">
          <Stat value={<>{L.people.length}<small className="muted" style={{ fontSize: "1rem" }}> / {TRIP.rsvps}</small></>} label={`signed up${L.pending.length ? ` · ${L.pending.length} mid-signup` : ""}`} t={L.people.length >= TRIP.rsvps ? "ok" : undefined} />
          <Stat value={L.cars.length} label={`cars · ${L.totalSeats} seats`} />
          <Stat value={seatGap >= 0 ? `+${seatGap}` : seatGap} label={`seats vs ${L.seatsNeeded} riding with group`} t={tone(seatGap)} />
          <Stat value={L.unassigned.length} label="riders without a car" t={L.unassigned.length ? "warn" : "ok"} />
          <Stat value={`${sleepNeed}/${sleepCap}`} label="need tent space / beds" t={tone(sleepCap - sleepNeed)} />
          <Stat value={bagGap >= 0 ? "✓" : bagGap} label={`bags: ${L.gear.bags.need} need, ${L.gear.bags.spare} spare`} t={tone(bagGap)} />
          <Stat value={padGap >= 0 ? "✓" : padGap} label={`pads: ${L.gear.pads.need} need, ${L.gear.pads.spare} spare`} t={tone(padGap)} />
          <Stat value={`$${L.money.foodTotal + L.money.boozeTotal}`} label={`$${L.money.foodTotal} food · $${L.money.boozeTotal} booze`} />
        </div>

        {/* Cars */}
        <section className="card">
          <h2>Cars</h2>
          {L.cars.length === 0 && <p className="muted">No drivers yet.</p>}
          <div className="grid">
            {L.cars.map((c) => (
              <div className="car" key={c.driver.phone}>
                <div className="row spread"><b>{c.driver.name}</b><span className={`pill ${c.free < 0 ? "bad" : c.free === 0 ? "ok" : "sea"}`}>{c.free < 0 ? `${-c.free} over` : `${c.free} free`}</span></div>
                <small className="muted">{short(c.driver.area)}{c.driver.areaDetail && ` · ${c.driver.areaDetail}`}{c.driver.stayLater && " · may stay late"}</small>
                <div className="seats" aria-label={`${c.seats} seats`}>
                  {Array.from({ length: Math.max(c.seats, c.passengers.length + 1) }).map((_, i) => (
                    <span key={i} className={`seat ${i === 0 ? "driver" : i <= c.passengers.length ? (i < c.seats ? "taken" : "over") : ""}`} />
                  ))}
                </div>
                {c.driver.carNotes && <small className="muted">“{c.driver.carNotes}”</small>}
                <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                  {c.passengers.map((p) => <li key={p.phone}>{p.name} <small className="muted">· {short(p.area)}</small></li>)}
                </ul>
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: 22 }}>Assign riders</h3>
          {riders.length === 0 ? <p className="muted">Nobody needs a ride yet.</p> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Rider</th><th>Area</th><th>Notes</th><th>Car</th></tr></thead>
                <tbody>
                  {riders.sort((a, b) => a.area.localeCompare(b.area)).map((p) => (
                    <tr key={p.phone}>
                      <td>{p.name}</td>
                      <td>{short(p.area)}{p.areaDetail && <><br /><small className="muted">{p.areaDetail}</small></>}</td>
                      <td>{p.stayLater && <span className="pill">may stay late</span>}</td>
                      <td><AssignSelect phone={p.phone} current={p.rideWith} drivers={driverOptions} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {(L.lateArrivals.length > 0 || L.people.some((p) => p.travel === "own-way")) && (
            <p className="muted" style={{ marginTop: 12 }}>
              Making their own way: {L.people.filter((p) => p.travel === "own-way").map((p) => p.name).join(", ") || "nobody"}.
              Arriving late: {L.lateArrivals.map((p) => p.name).join(", ") || "nobody"}.
            </p>
          )}
        </section>

        {/* Areas */}
        <section className="card">
          <h2>Who&apos;s where</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Area</th><th>People</th><th>Drivers</th><th>Seats</th><th>Who</th></tr></thead>
              <tbody>
                {L.areas.map(([area, a]) => (
                  <tr key={area}>
                    <td><b>{short(area)}</b></td>
                    <td>{a.people.length}</td>
                    <td>{a.drivers.length}</td>
                    <td>{a.seats}</td>
                    <td>{a.people.map((p) => p.name + (p.hasCar ? " 🚗" : "")).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Gear & sleep */}
        <div className="grid">
          <section className="card">
            <h2>Sleeping gear</h2>
            <GearGap label="Sleeping bags (incl. spare blankets)" need={L.gear.bags.need} spare={L.gear.bags.spare} who={L.gear.bags.who} />
            <GearGap label="Sleeping pads" need={L.gear.pads.need} spare={L.gear.pads.spare} who={L.gear.pads.who} />
            <h3 style={{ marginTop: 18 }}>Sleeping space</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Chunderdome: <b>{L.sleep.inDome}</b> want in, {L.sleep.domeCap} fit {L.sleep.inDome > L.sleep.domeCap && <span className="pill bad">{L.sleep.inDome - L.sleep.domeCap} over</span>}</li>
              <li>Group small tents: ~{TRIP.groupSmallTentBeds} beds</li>
              <li>Spare tents offered: {L.sleep.spareTentBeds} beds</li>
              <li>Bringing own tent: {L.sleep.ownTents} · sleeping in cars: {L.sleep.inCars}</li>
            </ul>
          </section>
          <section className="card">
            <h2>Spares on offer</h2>
            <table>
              <tbody>
                {L.gear.extras.map((g) => (
                  <tr key={g.key}>
                    <td>{g.label}</td>
                    <td><b>{g.total}</b></td>
                    <td><small className="muted">{g.owners.map((o) => `${o.name}${o.n > 1 ? ` ×${o.n}` : ""}`).join(", ")}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {L.people.some((p) => p.bringing) && (
              <>
                <h3 style={{ marginTop: 16 }}>Also bringing</h3>
                <ul style={{ margin: 0, paddingLeft: 18 }}>{L.people.filter((p) => p.bringing).map((p) => <li key={p.phone}>{p.name}: {p.bringing}</li>)}</ul>
              </>
            )}
          </section>
        </div>

        {/* Food & money */}
        <div className="grid">
          <section className="card">
            <h2>Dietary</h2>
            {L.diet.length === 0 && L.dietNotes.length === 0 && <p className="muted">No restrictions logged yet.</p>}
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {L.diet.map(([d, names]) => <li key={d}><b>{d}</b> ({names.length}): {names.join(", ")}</li>)}
            </ul>
            {L.dietNotes.length > 0 && (
              <>
                <h3 style={{ marginTop: 14 }}>Notes</h3>
                <ul style={{ margin: 0, paddingLeft: 18 }}>{L.dietNotes.map((n) => <li key={n.name}><b>{n.name}:</b> {n.note}</li>)}</ul>
              </>
            )}
          </section>
          <section className="card">
            <h2>Money</h2>
            <p>{L.money.foodIn} in for food (${L.money.foodTotal}) · {L.money.boozeIn} in for booze (${L.money.boozeTotal})</p>
            <div className="table-wrap" style={{ maxHeight: 320, overflowY: "auto" }}>
              <table>
                <thead><tr><th>Name</th><th>Venmo</th><th>Owes</th></tr></thead>
                <tbody>
                  {L.people.map((p) => (
                    <tr key={p.phone}>
                      <td>{p.name}</td>
                      <td>{p.venmo ? <a href={`https://venmo.com/u/${encodeURIComponent(p.venmo)}`} target="_blank" rel="noreferrer">@{p.venmo}</a> : <span className="pill bad">missing</span>}</td>
                      <td>${(p.agreeFood ? TRIP.foodBudget : 0) + (p.optInBooze ? TRIP.boozeBudget : 0)}{p.optInBooze && " 🍻"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Everyone */}
        <section className="card">
          <div className="row spread"><h2>Everyone</h2><small className="muted">{all.length} accounts</small></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Phone</th><th>Status</th><th>Getting there</th><th>Emergency</th><th>Notes</th><th></th></tr></thead>
              <tbody>
                {sorted.map((p: Profile) => (
                  <tr key={p.phone}>
                    <td>{p.name || <span className="muted">(no name)</span>}</td>
                    <td><a href={`sms:${p.phone}`}>{p.phone}</a></td>
                    <td>{p.onboardedAt ? <span className="pill ok">done</span> : <span className="pill warn">mid-signup</span>}</td>
                    <td>{p.hasCar ? `Driving (${p.carSeats})` : p.travel === "group" ? (p.rideWith ? `With ${nameOf.get(p.rideWith)}` : "Needs ride") : p.travel === "late" ? "Arriving late" : "Own way"}</td>
                    <td>{p.emergencyPhone ? <small>{p.emergencyName} {p.emergencyPhone}</small> : p.onboardedAt ? <span className="pill warn">none</span> : null}</td>
                    <td><small className="muted">{p.notes}</small></td>
                    <td>
                      {p.phone !== me && (
                        <form action={removePerson}>
                          <input type="hidden" name="phone" value={p.phone} />
                          <ConfirmButton label="Remove" confirm={`Remove ${p.name || p.phone} from the trip? Their answers will be deleted.`} />
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Admins */}
        <section className="card">
          <h2>Admins</h2>
          <ul style={{ paddingLeft: 18 }}>
            {admins.map((a) => (
              <li key={a} style={{ marginBottom: 6 }}>
                <div className="row">
                  <span>{nameOf.get(a) ?? a} <small className="muted">{a}</small></span>
                  {owners.includes(a) ? <span className="pill">owner</span> : a !== me && (
                    <form action={removeAdmin}><input type="hidden" name="phone" value={a} /><button className="btn small ghost">Remove</button></form>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <form action={addAdmin} className="row">
            <input name="phone" type="tel" placeholder="Phone number to make admin" style={{ maxWidth: 280 }} required />
            <button className="btn small">Add admin</button>
          </form>
        </section>
      </main>
    </>
  );
}

function GearGap({ label, need, spare, who }: { label: string; need: number; spare: number; who: Profile[] }) {
  const gap = spare - need;
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="row spread">
        <b>{label}</b>
        <span className={`pill ${gap >= 0 ? "ok" : "bad"}`}>{need} needed · {spare} spare {gap < 0 ? `· short ${-gap}` : ""}</span>
      </div>
      {who.length > 0 && <small className="muted">Needs one: {who.map((p) => p.name).join(", ")}</small>}
    </div>
  );
}
