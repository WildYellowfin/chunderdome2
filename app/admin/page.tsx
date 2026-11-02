import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db, ownerPhones } from "@/lib/db";
import { billNote, computeLogistics, usd, venmoLink } from "@/lib/logistics";
import { CLAY_HOUSE, kmBetween, TRIP, TRUNK_OPTIONS } from "@/lib/trip";
import { addAdmin, removeAdmin, removePerson } from "@/app/actions";
import TabBar from "@/components/TabBar";
import AssignSelect from "@/components/AssignSelect";
import CopyButton from "@/components/CopyButton";
import ConfirmButton from "@/components/ConfirmButton";
import AdminMap, { type Pin } from "@/components/AdminMap";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

const tone = (gap: number) => (gap >= 0 ? "ok" : gap >= -2 ? "warn" : "bad");
const signed = (n: number) => (n > 0 ? `+${n}` : String(n));
const mi = (p: Profile) => (p.pickup ? `${(kmBetween(p.pickup, CLAY_HOUSE) * 0.621371).toFixed(1)} mi` : "no pin");
const where = (p: Profile) => `${p.area || "No pin"} · ${mi(p)}`;
const time12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
const homeBy = (p: Profile) => (p.returnPref === "earlier" ? `Back by ${p.returnBy ? time12(p.returnBy) : "?"}` : p.returnPref === "later" ? "Can stay later" : "");

export default async function AdminPage() {
  const { phone: me } = await requireAdmin();
  const all = await db.listProfiles();
  const L = computeLogistics(all);
  const owners = ownerPhones();
  const admins = [...new Set([...owners, ...(await db.listAdmins())])];
  const nameOf = new Map(all.map((p) => [p.phone, p.name || p.phone]));

  const riders = [...L.needRide].sort((a, b) => a.area.localeCompare(b.area));
  const seatGap = L.totalSeats - L.seatsNeeded;
  const bedGap = L.sleep.beds - L.people.length;
  const bagGap = L.gear.bags.spare - L.gear.bags.need;
  const padGap = L.gear.pads.spare - L.gear.pads.need;
  const driverOptions = L.cars.map((c) => ({ phone: c.driver.phone, label: `${c.driver.name} · ${c.free} free` }));
  const sorted = [...all].sort((a, b) => (a.name || "~").localeCompare(b.name || "~"));
  const T = L.money.transport;
  const pins: Pin[] = L.people.filter((p) => p.pickup).map((p) => ({
    name: p.name, lat: p.pickup!.lat, lng: p.pickup!.lng, driver: p.hasCar, seats: p.hasCar ? p.carSeats : undefined,
    sub: p.hasCar ? `Driving, ${p.carSeats} seats` : p.rideWith ? `With ${nameOf.get(p.rideWith)}` : "Needs a seat",
  }));

  const stats: { v: string | number; l: string; t?: string }[] = [
    { v: `${L.people.length}/${TRIP.rsvps}`, l: `signed up${L.pending.length ? `, ${L.pending.length} part-way` : ""}`, t: L.people.length >= TRIP.rsvps ? "ok" : undefined },
    { v: `${L.cars.length}`, l: `cars, ${L.totalSeats} seats` },
    { v: signed(seatGap), l: `seats vs ${L.seatsNeeded} people`, t: tone(seatGap) },
    { v: L.unassigned.length, l: "riders without a car yet", t: L.unassigned.length ? "warn" : "ok" },
    { v: signed(bedGap), l: `tent beds (${L.sleep.beds}) vs people`, t: tone(bedGap) },
    { v: signed(bagGap), l: `bags: ${L.gear.bags.need} needed, ${L.gear.bags.spare} to lend`, t: tone(bagGap) },
    { v: signed(padGap), l: `pads: ${L.gear.pads.need} needed, ${L.gear.pads.spare} to lend`, t: tone(padGap) },
    { v: usd(L.money.foodTotal + L.money.boozeTotal), l: `${usd(L.money.foodTotal)} food, ${usd(L.money.boozeTotal)} booze` },
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

        <section className="block">
          <div className="block-head"><h2 className="d d-m">Pickups</h2><span className="mono faint">{pins.length} pins</span></div>
          <AdminMap pins={pins} />
        </section>

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
                <div className="hint" style={{ marginTop: 2 }}>{where(c.driver)}</div>
                <div className="seats">
                  {Array.from({ length: Math.max(c.seats, c.passengers.length + 1) }).map((_, i) => (
                    <span key={i} className={`seat ${i === 0 ? "driver" : i <= c.passengers.length ? (i < c.seats ? "taken" : "over") : ""}`} />
                  ))}
                </div>
                <div className="hint" style={{ marginTop: 0 }}>Trunk: {TRUNK_OPTIONS[c.driver.trunk ?? 1].toLowerCase()}{homeBy(c.driver) && ` · ${homeBy(c.driver)}`}</div>
                {c.passengers.length > 0 && <div style={{ fontSize: 15, marginTop: 6 }}>{c.passengers.map((p) => `${p.name} (${p.area}${homeBy(p) ? `, ${homeBy(p).toLowerCase()}` : ""})`).join(", ")}</div>}
              </div>
            ))}
          </section>

          <section className="block">
            <div className="block-head"><h2 className="d d-m">Seat riders</h2><span className="mono faint">{L.unassigned.length} left</span></div>
            {riders.length === 0 ? <p className="muted">Nobody needs a seat yet.</p> : riders.map((p) => (
              <div className="person" key={p.phone}>
                <div className="row spread"><strong>{p.name}</strong>{homeBy(p) && <span className={`tag ${p.returnPref === "earlier" ? "warn" : ""}`}>{homeBy(p)}</span>}</div>
                <div className="hint" style={{ marginTop: 2 }}>{where(p)}</div>
                <AssignSelect phone={p.phone} current={p.rideWith} drivers={driverOptions} />
              </div>
            ))}
          </section>

          <section className="block">
            <h2 className="d d-m" style={{ marginBottom: 12 }}>By area</h2>
            <ul className="list">
              {L.areas.map(([area, a]) => (
                <li key={area}>
                  <div className="row spread"><strong>{area}</strong><span className="mono">{a.people.length} ppl · {a.seats} seats</span></div>
                  <div className="hint" style={{ marginTop: 2 }}>{a.people.map((p) => p.name + (p.hasCar ? " (car)" : "")).join(", ")}</div>
                </li>
              ))}
            </ul>
          </section>

          <section className="block">
            <h2 className="d d-m" style={{ marginBottom: 12 }}>Sunday</h2>
            <ul className="list">
              <li><div className="row spread"><strong>1 PM is perfect</strong><span className="mono">{L.returning.onTime.length}</span></div></li>
              <li>
                <div className="row spread"><strong>Happy to stay later</strong><span className="mono">{L.returning.later.length}</span></div>
                {L.returning.later.length > 0 && <div className="hint" style={{ marginTop: 2 }}>{L.returning.later.map((p) => p.name + (p.hasCar ? " (car)" : "")).join(", ")}</div>}
              </li>
              <li>
                <div className="row spread"><strong>Need to be back earlier</strong><span className={`tag ${L.returning.earlier.length ? "warn" : ""}`}>{L.returning.earlier.length}</span></div>
                {L.returning.earlier.length > 0 && <div className="hint" style={{ marginTop: 2 }}>{L.returning.earlier.map((p) => `${p.name}${p.hasCar ? " (car)" : ""} by ${p.returnBy ? time12(p.returnBy) : "?"}`).join(", ")}</div>}
              </li>
            </ul>
          </section>

          <section className="block">
            <h2 className="d d-m" style={{ marginBottom: 12 }}>Sleeping</h2>
            <ul className="list">
              <GapRow label="Sleeping bags" need={L.gear.bags.need} spare={L.gear.bags.spare} who={L.gear.bags.who} lenders={L.gear.lend[0].owners} />
              <GapRow label="Sleeping pads" need={L.gear.pads.need} spare={L.gear.pads.spare} who={L.gear.pads.who} lenders={L.gear.lend[1].owners} />
              <li>
                <div className="row spread"><strong>Tent beds</strong><span className={`tag ${bedGap >= 0 ? "ok" : "bad"}`}>{L.sleep.beds} for {L.people.length}</span></div>
                <div className="hint" style={{ marginTop: 2 }}>
                  Chunderdome {L.sleep.domeCap} · group tents ~{TRIP.groupSmallTentBeds}
                  {L.gear.tents.length > 0 && <> · lent: {L.gear.tents.map((t) => `${t.name}'s ${t.sleeps}-person`).join(", ")}</>}
                </div>
              </li>
            </ul>
          </section>

          <section className="block">
            <h2 className="d d-m" style={{ marginBottom: 12 }}>Gear</h2>
            <ul className="list">
              {L.gear.bring.filter((g) => g.total > 0).map((g) => (
                <li key={g.key}>
                  <div className="row spread"><strong>{g.label}</strong><span className="d d-s">{g.total}</span></div>
                  <div className="hint" style={{ marginTop: 2 }}>{g.owners.map((o) => `${o.name}${o.n > 1 ? ` ×${o.n}` : ""}`).join(", ")}</div>
                </li>
              ))}
            </ul>
            {L.gear.bring.every((g) => g.total === 0) && <p className="muted">Nobody has listed gear yet.</p>}
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
          <div className="block-head"><h2 className="d d-m">Money</h2><span className="mono faint">{L.money.eaters} eating · {L.money.boozeIn} booze</span></div>
          <p className="muted" style={{ fontSize: 15 }}>
            Fuel and tolls: {usd(T.total)} logged by {T.logged} of {T.drivers} drivers, {usd(T.share)} each across {L.people.length}. Drivers eat free, and what they spent comes off their total.
          </p>
          {(() => {
            const lines = [...L.money.bills].filter((b) => b.total !== 0).sort((a, b) => a.p.name.localeCompare(b.p.name))
              .map((b) => `${b.p.venmo ? "@" + b.p.venmo : b.p.name + " (no Venmo)"}\t${b.total < 0 ? "pay" : "request"} ${Math.abs(b.total).toFixed(2)}\t${billNote(b)}`);
            return lines.length > 0 && (
              <div className="row" style={{ marginBottom: 12 }}>
                <CopyButton text={lines.join("\n")} label="Copy Venmo list" />
              </div>
            );
          })()}
          <ul className="list">
            {[...L.money.bills].sort((a, b) => a.p.name.localeCompare(b.p.name)).map((b) => (
              <li key={b.p.phone}>
                <div className="row spread" style={{ alignItems: "baseline", flexWrap: "nowrap" }}>
                  <strong>{b.p.name}{b.p.hasCar && <span className="faint" style={{ fontWeight: 400 }}> · driver</span>}</strong>
                  <strong className={`d d-s ${b.total < 0 ? "red" : ""}`} style={{ whiteSpace: "nowrap" }}>{b.total < 0 ? `Owed ${usd(-b.total)}` : usd(b.total)}</strong>
                </div>
                <div className="hint" style={{ marginTop: 2 }}>
                  {b.p.hasCar ? "Food free" : `Food ${usd(b.food)}`}
                  {b.booze > 0 && ` · booze ${usd(b.booze)}`}
                  {` · transport ${usd(b.transport)}`}
                  {b.spent > 0 && ` · spent\u00a0−${usd(b.spent)}`}
                </div>
                <div className="row" style={{ marginTop: 8, gap: 8 }}>
                  {b.p.venmo && b.total !== 0
                    ? <a className="btn sm ghost" href={venmoLink(b.p.venmo, b)}>{b.total < 0 ? `Pay @${b.p.venmo} ${usd(-b.total)}` : `Request ${usd(b.total)} from @${b.p.venmo}`}</a>
                    : <span className="hint" style={{ margin: 0 }}>{b.p.venmo ? `@${b.p.venmo}` : "No Venmo"}</span>}
                </div>
              </li>
            ))}
          </ul>
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
                {p.onboardedAt && <> · {p.hasCar ? `Driving (${p.carSeats})` : p.rideWith ? `With ${nameOf.get(p.rideWith)}` : "Needs a seat"} · {p.area || "no pin"}</>}
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

function GapRow({ label, need, spare, who, lenders }: { label: string; need: number; spare: number; who: Profile[]; lenders: { name: string; n: number }[] }) {
  const gap = spare - need;
  return (
    <li>
      <div className="row spread"><strong>{label}</strong><span className={`tag ${gap >= 0 ? "ok" : "bad"}`}>{gap >= 0 ? "Covered" : `Short ${-gap}`}</span></div>
      <div className="hint" style={{ marginTop: 2 }}>
        {need} need{who.length > 0 && ` (${who.map((p) => p.name).join(", ")})`}, {spare} to lend{lenders.length > 0 && ` (${lenders.map((o) => `${o.name}${o.n > 1 ? ` ×${o.n}` : ""}`).join(", ")})`}
      </div>
    </li>
  );
}
