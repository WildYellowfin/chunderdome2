import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { signOut } from "@/app/actions";
import { EXTRA_GEAR, TRIP } from "@/lib/trip";
import TabBar from "@/components/TabBar";

const TRAVEL = { group: "With the group, 6 PM Friday", "own-way": "Own way, same time", late: "Arriving late" };
const SLEEP = { chunderdome: "The Chunderdome", "own-tent": "Own tent", car: "In a car", undecided: "Wherever there's room" };
const BAG = { bag: "Own sleeping bag", blanket: "Bringing blankets", need: "Needs to borrow a bag" };

export default async function MePage() {
  const { profile: p, admin } = await requireOnboarded();
  const extras = EXTRA_GEAR.filter((g) => (p.extras[g.key] || 0) > 0).map((g) => `${g.label} ×${p.extras[g.key]}`);
  const rows: [string, React.ReactNode][] = [
    ["Phone", p.phone],
    ["Area", <>{p.area}{p.areaDetail && <><br /><span className="muted">{p.areaDetail}</span></>}</>],
    ["Travel", TRAVEL[p.travel]],
    ["Car", p.hasCar ? `Driving, ${p.carSeats} seats` : "Needs a seat"],
    ["Sleep", `${SLEEP[p.sleeping]} · ${BAG[p.sleepSetup]} · ${p.padSetup === "own" ? "own pad" : "needs a pad"}`],
    ["Sharing", extras.length ? extras.join(", ") : "Nothing extra"],
    ["Diet", [...p.dietary, p.dietaryNotes].filter(Boolean).join(", ") || "No restrictions"],
    ["Venmo", `@${p.venmo}`],
    ["Owes", `$${TRIP.foodBudget + (p.optInBooze ? TRIP.boozeBudget : 0)}${p.optInBooze ? " (incl. booze kitty)" : ""}`],
    ["Emergency", p.emergencyPhone ? `${p.emergencyName} ${p.emergencyPhone}` : "Not set"],
  ];
  return (
    <>
      <header className="topline"><Link href="/" className="brand">Chunderdome <span>II</span></Link><span className="mono faint">Me</span></header>
      <main className="page">
        <section className="block" style={{ borderTop: 0 }}>
          <h1 className="d d-l">{p.name}</h1>
          <ul className="list" style={{ marginTop: 18 }}>
            {rows.map(([k, v]) => (
              <li key={k} className="kv"><span className="mono faint">{k}</span><span>{v}</span></li>
            ))}
          </ul>
          <Link className="btn block-btn" href="/me/edit" style={{ marginTop: 20 }}>Edit my answers</Link>
        </section>
        <section className="block">
          <form action={signOut}><button className="btn ghost block-btn">Sign out</button></form>
        </section>
      </main>
      <TabBar admin={admin} />
    </>
  );
}
