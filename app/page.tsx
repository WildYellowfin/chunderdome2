import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { db } from "@/lib/db";
import { GROUP_GEAR, MEALS, TRIP } from "@/lib/trip";
import { packingList } from "@/lib/packing";
import { bill, transportTotals, usd } from "@/lib/logistics";
import Masthead from "@/components/Masthead";
import TabBar from "@/components/TabBar";

export const dynamic = "force-dynamic";

const first = (n: string) => n.split(/\s+/)[0] || n;

export default async function Home({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { profile: me, admin } = await requireOnboarded();
  const { welcome } = await searchParams;
  const everyone = (await db.listProfiles()).filter((p) => p.onboardedAt).sort((a, b) => a.name.localeCompare(b.name));

  const driver = me.hasCar ? me : everyone.find((p) => p.phone === me.rideWith && p.hasCar);
  const carmates = driver ? everyone.filter((p) => p.rideWith === driver.phone && p.phone !== driver.phone) : [];
  const items = packingList(me);
  const packed = items.filter((i) => me.packed.includes(i.id)).length;
  const cars = everyone.filter((p) => p.hasCar).length;
  const T = transportTotals(everyone);
  const tab = bill(me, T.share);

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
          <div className="block-head"><h2 className="d d-m">Your ride</h2><span className="mono faint">Leaves 6:00 PM</span></div>
          {driver ? (
            <div className="car">
              <div className="row spread">
                <strong className="d d-s">{driver.phone === me.phone ? "You're driving" : `${first(driver.name)}'s car`}</strong>
                {driver.phone !== me.phone && <a className="btn sm ghost" href={`sms:${driver.phone}`}>Text</a>}
              </div>
              <div className="seats" aria-label={`${driver.carSeats} seats`}>
                {Array.from({ length: driver.carSeats }).map((_, i) => (
                  <span key={i} className={`seat ${i === 0 ? "driver" : i <= carmates.length ? "taken" : ""}`} />
                ))}
              </div>
              {carmates.length
                ? <p style={{ margin: 0 }}>{driver.phone !== me.phone && <>{driver.name} (driving), </>}{carmates.map((p) => p.name).join(", ")}</p>
                : <p className="muted" style={{ margin: 0 }}>{driver.phone === me.phone ? "Riders will appear here once they're assigned." : "Just you so far."}</p>}
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
          <div className="note ink" style={{ marginTop: 16 }}>
            <div className="mono" style={{ opacity: 0.7 }}>Your share</div>
            <div className="d d-l" style={{ margin: "4px 0" }}>{T.total ? usd(Math.abs(tab.total)) : tab.food + tab.booze ? usd(tab.food + tab.booze) : "Free"}{T.total ? "" : " + fuel"}</div>
            <div style={{ fontSize: 14, opacity: 0.85 }}>
              {!me.agreeFood ? "No food" : me.hasCar ? "Food is free, you're driving" : `$${TRIP.foodBudget} food`}{me.optInBooze ? ` + $${TRIP.boozeBudget} drinks` : ""}, plus an even share of fuel and tolls{tab.total < 0 ? ". You're owed this" : ""}. Settled up after the trip.
            </div>
          </div>
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
