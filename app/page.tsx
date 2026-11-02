import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { db } from "@/lib/db";
import { GROUP_GEAR, ITINERARY, MEALS, TRIP } from "@/lib/trip";
import { packingList } from "@/lib/packing";
import TopBar from "@/components/TopBar";
import Countdown from "@/components/Countdown";
import MapArt from "@/components/MapArt";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";

function firstName(n: string) {
  return n.split(/\s+/)[0] || n;
}

export default async function Home({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { profile: me, admin } = await requireOnboarded();
  const { welcome } = await searchParams;
  const everyone = (await db.listProfiles()).filter((p) => p.onboardedAt).sort((a, b) => a.name.localeCompare(b.name));

  const myDriver = me.hasCar ? me : everyone.find((p) => p.phone === me.rideWith && p.hasCar);
  const carmates = myDriver ? everyone.filter((p) => p.rideWith === myDriver.phone && p.phone !== myDriver.phone) : [];
  const items = packingList(me);
  const packedCount = items.filter((i) => me.packed.includes(i.id)).length;
  const cars = everyone.filter((p) => p.hasCar).length;

  return (
    <>
      <TopBar admin={admin} />
      <section className="hero">
        <div className="wrap">
          <div className="eyebrow">Dillon Beach · Nov 13–15, 2026</div>
          <h1>Chunderdome <span className="numeral">II</span></h1>
          <p className="tag">{TRIP.tagline}</p>
          <Countdown to={TRIP.departISO} />
          <MapArt />
        </div>
      </section>

      <main className="wrap">
        {welcome && (
          <div className="card" style={{ marginTop: 24, background: "#fff3ec", borderColor: "#f3c7b2" }}>
            <h3>You&apos;re in, {firstName(me.name)}. 🔥</h3>
            <p style={{ margin: 0 }}>Next: check out <Link href="/packing">your packing list</Link>. You can change your answers any time under <Link href="/me">My info</Link>.</p>
          </div>
        )}

        <section className="section grid">
          <div className="card">
            <div className="kicker">Your ride</div>
            {me.travel === "late" ? (
              <p>You&apos;re arriving late. Text an admin when you&apos;re on your way.</p>
            ) : me.travel === "own-way" ? (
              <p>You&apos;re making your own way. Aim to arrive around {TRIP.arriveLabel}.</p>
            ) : myDriver ? (
              <>
                <h3>{myDriver.phone === me.phone ? "You're driving" : `${firstName(myDriver.name)}'s car`}</h3>
                <p className="muted">Leaves {TRIP.departLabel}{myDriver.phone !== me.phone && <> · <a href={`sms:${myDriver.phone}`}>text {firstName(myDriver.name)}</a></>}</p>
                {carmates.length ? (
                  <div className="crew">{carmates.map((p) => <span className="pill" key={p.phone}>{p.name}</span>)}</div>
                ) : (
                  <p className="muted">{myDriver.phone === me.phone ? "Passengers will show up here once they're assigned." : "Just you so far."}</p>
                )}
              </>
            ) : (
              <><h3>Being sorted</h3><p className="muted">We&apos;ll match you with a car from near {me.area.replace(/^SF · /, "")}. Check back soon.</p></>
            )}
          </div>

          <div className="card">
            <div className="kicker">Packing</div>
            <h3>{packedCount} of {items.length} packed</h3>
            <div className="progress" style={{ margin: "10px 0 14px" }}><div style={{ width: `${(packedCount / items.length) * 100}%` }} /></div>
            <Link className="btn small" href="/packing">Open my list</Link>
          </div>

          <div className="card">
            <div className="kicker">The crew</div>
            <h3>{everyone.length} signed up · {cars} cars</h3>
            <div className="crew" style={{ marginTop: 10 }}>
              {everyone.map((p) => <Avatar key={p.phone} name={p.name} />)}
            </div>
          </div>
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <div className="grid">
            <div className="card">
              <div className="kicker">The plan</div>
              <h2>Three days of glory</h2>
              {ITINERARY.map((d) => (
                <div key={d.day} style={{ marginBottom: 14 }}>
                  <h3 style={{ marginTop: 10 }}>{d.day}</h3>
                  <ul className="timeline">
                    {d.items.map((i) => (
                      <li key={i.time + i.what}>
                        <span className="t">{i.time}</span>
                        <span>{i.what}{i.note && <><br /><small className="muted">{i.note}</small></>}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="stack">
              <div className="card">
                <div className="kicker">Food</div>
                <h3>What&apos;s covered</h3>
                <ul className="timeline">
                  {MEALS.map((m) => (
                    <li key={m.meal}><span className="t">{m.provided ? "Provided" : "On you"}</span><span>{m.meal}{m.note && <><br /><small className="muted">{m.note}</small></>}</span></li>
                  ))}
                </ul>
                <p className="muted" style={{ marginTop: 10 }}>
                  ${TRIP.foodBudget} each for food, plus ${TRIP.boozeBudget} for the booze kitty if you opted in. Venmo requests come after.
                  You&apos;re in for <b>${TRIP.foodBudget + (me.optInBooze ? TRIP.boozeBudget : 0)}</b>.
                </p>
              </div>
              <div className="card">
                <div className="kicker">Group gear</div>
                <h3>Already handled</h3>
                <ul style={{ margin: 0, paddingLeft: 18 }}>{GROUP_GEAR.map((g) => <li key={g}>{g}</li>)}</ul>
              </div>
              <div className="card">
                <div className="kicker">Good to know</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>Sunset Friday is {TRIP.sunsetFriday}, so we set up in the dark.</li>
                  <li>Nights drop to the mid-40s °F with wind off the water.</li>
                  <li>Cell signal is patchy past Tomales. Download offline maps.</li>
                  <li>Leave no trace. We pack out everything we bring in.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="footer">Chunderdome II · Dillon Beach · Nov 13–15, 2026</footer>
    </>
  );
}
