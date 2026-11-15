import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { db } from "@/lib/db";
import { GROUP_GEAR, MEALS, TRIP } from "@/lib/trip";
import { packingList } from "@/lib/packing";
import { stayLabel, wholeWeekend } from "@/lib/logistics";
import Masthead from "@/components/Masthead";
import TabBar from "@/components/TabBar";
import CopyButton from "@/components/CopyButton";
import GroupText from "@/components/GroupText";
import { formatPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

const first = (n: string) => n.split(/\s+/)[0] || n;

export default async function Home({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { profile: me, admin } = await requireOnboarded();
  const { welcome } = await searchParams;
  const everyone = (await db.listProfiles()).filter((p) => p.onboardedAt).sort((a, b) => a.name.localeCompare(b.name));

  const driver = me.hasCar ? me : everyone.find((p) => p.phone === me.rideWith && p.hasCar);
  const carmates = driver ? everyone.filter((p) => p.rideWith === driver.phone && p.phone !== driver.phone) : [];
  // Everyone in the car, driver first, and the numbers of everyone but me for a group chat.
  const crew = driver ? [driver, ...carmates] : [];
  const theirNumbers = crew.filter((p) => p.phone !== me.phone).map((p) => p.phone);
  const items = packingList(me);
  const packed = items.filter((i) => me.packed.includes(i.id)).length;
  const cars = everyone.filter((p) => p.hasCar).length;

  return (
    <>
      <main className="page">
        <Masthead />

        {welcome && (
          <section className="block" style={{ borderTop: 0 }}>
            <div className="note red">
              <div className="d d-m">You&apos;re in, {first(me.name)}.</div>
              <p style={{ margin: "8px 0 0" }}>Your packing list is ready. You can change any answer later in your Profile.</p>
            </div>
          </section>
        )}

        <section className="block" style={welcome ? undefined : { borderTop: 0 }}>
          <div className="block-head">
            <h2 className="d d-m">{me.ownWay ? "Getting there" : "Your ride"}</h2>
            <span className="mono faint">{wholeWeekend(me) ? (me.ownWay ? "" : "Leaves 6:00 PM") : stayLabel(me)}</span>
          </div>
          {me.ownWay ? (
            <div className="note">
              <strong>You&apos;re making your own way.</strong>
              <p className="muted" style={{ margin: "4px 0 0" }}>See you at {TRIP.destination}. Changed your mind? Switch to riding or driving in your Profile.</p>
            </div>
          ) : driver ? (
            <div className="car">
              <strong className="d d-s">{driver.phone === me.phone ? "You're driving" : `${first(driver.name)}'s car`}</strong>
              <div className="seats" aria-label={`${driver.carSeats} seats`}>
                {Array.from({ length: Math.max(driver.carSeats, crew.length) }).map((_, i) => (
                  <span key={i} className={`seat ${i === 0 ? "driver" : i < crew.length ? (i < driver.carSeats ? "taken" : "over") : ""}`} />
                ))}
              </div>
              {theirNumbers.length ? (
                <>
                  <ul className="list carmates">
                    {crew.map((p) => (
                      <li key={p.phone}>
                        <span><strong>{p.name}</strong>{p.phone === driver.phone && <span className="faint"> · driving</span>}</span>
                        {p.phone === me.phone ? <span className="faint">You</span> : <a href={`sms:${p.phone}`}>{formatPhone(p.phone)}</a>}
                      </li>
                    ))}
                  </ul>
                  <div className="row" style={{ marginTop: 14 }}>
                    <GroupText phones={theirNumbers} />
                    <CopyButton text={theirNumbers.join(", ")} label="Copy numbers" />
                  </div>
                  <p className="hint" style={{ margin: "10px 0 0" }}>Anyone in the car can start the group chat. Copy gets everyone&apos;s number but yours.</p>
                </>
              ) : <p className="muted" style={{ margin: 0 }}>Riders will appear here once they&apos;re assigned.</p>}
            </div>
          ) : (
            <div className="note">
              <strong>Car to be decided.</strong>
              <p className="muted" style={{ margin: "4px 0 0" }}>We&apos;ll match you with a driver near {me.area || "your pin"}.</p>
            </div>
          )}
        </section>

        <section className="block">
          <div className="block-head"><h2 className="d d-m">Packing</h2><span className="mono">{packed}/{items.length}</span></div>
          <div className="meter"><div style={{ width: `${(packed / items.length) * 100}%` }} /></div>
          <Link className="btn block-btn" href="/packing" style={{ marginTop: 16 }}>Open my list</Link>
        </section>


        <section className="block">
          <h2 className="d d-m" style={{ marginBottom: 12 }}>Food</h2>
          <ul className="list">
            {MEALS.map((m) => (
              <li key={m.meal} className="row spread">
                <span>{m.meal}</span>
                <span className={`tag ${m.provided ? "solid" : ""}`}>{m.provided ? "Provided" : "On you"}</span>
              </li>
            ))}
          </ul>
          <p className="hint" style={{ margin: "14px 0 0" }}>Paid for something for the group? <Link href="/me#expenses">Add it to your expenses</Link>. We&apos;ll settle up once everything&apos;s in.</p>
        </section>

        <section className="block">
          <div className="block-head"><h2 className="d d-m">The crew</h2><span className="mono faint">{everyone.length} in · {cars} cars</span></div>
          <ol className="roster">
            {everyone.map((p, i) => (
              <li key={p.phone}><span>{String(i + 1).padStart(2, "0")}</span><span>{p.name}</span></li>
            ))}
          </ol>
        </section>

        <section className="block">
          <h2 className="d d-m" style={{ marginBottom: 12 }}>Already handled by the group</h2>
          <p style={{ margin: 0 }}>{GROUP_GEAR.join(" · ")}</p>
        </section>

        <p className="foot mono faint">Chunderdome II · Dillon Beach · MMXXVI</p>
      </main>
      <TabBar admin={admin} />
    </>
  );
}
