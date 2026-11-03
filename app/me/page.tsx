import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { signOut } from "@/app/actions";
import { db } from "@/lib/db";
import { bill, transportTotals, usd } from "@/lib/logistics";
import { BRING_GEAR, LEND_GEAR, RETURN_OPTIONS, TRUNK_OPTIONS } from "@/lib/trip";
import TabBar from "@/components/TabBar";
import Costs from "@/components/Costs";

const time12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return Number.isFinite(h) ? `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}` : t;
};
const BAG = { bag: "Own sleeping bag", blanket: "Bringing blankets", need: "Borrowing a bag" };

export default async function MePage() {
  const { profile: p, admin } = await requireOnboarded();
  const people = (await db.listProfiles()).filter((x) => x.onboardedAt);
  const T = transportTotals(people);
  const b = bill(p, T.share);
  const lending = [
    ...LEND_GEAR.filter((g) => (p.extras[g.key] || 0) > 0).map((g) => `${g.label} ×${p.extras[g.key]}`),
    ...(p.tents || []).map((s) => `Tent for ${s}`),
  ];
  const bringing = BRING_GEAR.filter((g) => (p.extras[g.key] || 0) > 0).map((g) => `${g.label} ×${p.extras[g.key]}`);
  const ret = RETURN_OPTIONS.find((o) => o.value === p.returnPref)?.title ?? "";
  const rows: [string, React.ReactNode][] = [
    ["Phone", p.phone],
    ["Pickup", p.area || "No pin yet"],
    ["Car", p.hasCar ? `Driving, ${p.carSeats} seats · ${TRUNK_OPTIONS[p.trunk ?? 1].toLowerCase()}` : "Needs a seat"],
    ["Sunday", p.returnPref === "earlier" ? `Back by ${time12(p.returnBy)}` : ret],
    ["Sleep", `${BAG[p.sleepSetup]} · ${p.padSetup === "own" ? "own pad" : "borrowing a pad"}`],
    ["Lending", lending.length ? lending.join(", ") : "Nothing"],
    ["Bringing", bringing.length ? bringing.join(", ") : "Nothing listed"],
    ["Diet", [...p.dietary, p.dietaryNotes].filter(Boolean).join(", ") || "No restrictions"],
    ["Venmo", p.venmo ? `@${p.venmo}` : "None"],
  ];
  return (
    <>
      <header className="topline"><Link href="/" className="brand">Chunderdome <span>II</span></Link><span className="mono faint">Profile</span></header>
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
          <h2 className="d d-m" style={{ marginBottom: 12 }}>Your tab</h2>
          <ul className="list">
            <li className="row spread"><span>Food</span><span>{!p.agreeFood ? "Not eating with us" : p.hasCar ? "Free, you're driving" : usd(b.food)}</span></li>
            {b.booze > 0 && <li className="row spread"><span>Drinks</span><span>{usd(b.booze)}</span></li>}
            <li className="row spread"><span>Fuel and tolls share</span><span>{T.total ? usd(b.transport) : "After the trip"}</span></li>
            {b.spent > 0 && <li className="row spread"><span>Group expenses</span><span>−{usd(b.spent)}</span></li>}
            <li className="row spread"><strong>{b.total < 0 ? "You're owed" : "Total"}</strong><strong className="d d-s">{usd(Math.abs(b.total))}</strong></li>
          </ul>
          <Costs driver={p.hasCar} fuel={p.fuelCost || 0} tolls={p.tollCost || 0} group={p.groupCost || 0} />
        </section>
        <section className="block">
          <form action={signOut}><button className="btn ghost block-btn">Sign out</button></form>
        </section>
      </main>
      <TabBar admin={admin} />
    </>
  );
}
