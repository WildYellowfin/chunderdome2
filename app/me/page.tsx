import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { removeExpense, signOut } from "@/app/actions";
import { inCars, satNight, sleepsOver, spent, stayLabel, usd } from "@/lib/logistics";
import { BRING_GEAR, LEND_GEAR, RETURN_OPTIONS, TRUNK_OPTIONS } from "@/lib/trip";
import TabBar from "@/components/TabBar";
import AddExpense from "@/components/AddExpense";
import ConfirmButton from "@/components/ConfirmButton";

const time12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return Number.isFinite(h) ? `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}` : t;
};
const BAG = { bag: "Own sleeping bag", blanket: "Bringing blankets", need: "Borrowing a bag" };

export default async function MePage() {
  const { profile: p, admin } = await requireOnboarded();
  const total = spent(p);
  const lending = [
    ...LEND_GEAR.filter((g) => (p.extras[g.key] || 0) > 0).map((g) => `${g.label} ×${p.extras[g.key]}`),
    ...(p.tents || []).map((s) => `Tent for ${s}`),
  ];
  const bringing = BRING_GEAR.filter((g) => (p.extras[g.key] || 0) > 0).map((g) => `${g.label} ×${p.extras[g.key]}`);
  const ret = RETURN_OPTIONS.find((o) => o.value === p.returnPref)?.title ?? "";
  const rows: [string, React.ReactNode][] = [
    ["Phone", p.phone],
    ["Weekend", stayLabel(p)],
    ["Getting there", p.hasCar ? `Driving, ${p.carSeats} seats · ${TRUNK_OPTIONS[p.trunk ?? 1].toLowerCase()}` : p.ownWay ? "Making my own way" : "Riding with the group"],
    ...(inCars(p) ? [[p.hasCar ? "From" : "Pickup", p.area || "No pin yet"] as [string, string]] : []),
    ...(inCars(p) && satNight(p) ? [["Sunday", p.returnPref === "earlier" ? `Back by ${time12(p.returnBy)}` : ret] as [string, string]] : []),
    ["Sleep", sleepsOver(p) ? `${BAG[p.sleepSetup]} · ${p.padSetup === "own" ? "own pad" : "borrowing a pad"}` : "Not staying over"],
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
        <section className="block" id="expenses">
          <div className="block-head"><h2 className="d d-m">Group expenses</h2>{total > 0 && <span className="d d-s">{usd(total)}</span>}</div>
          <p className="hint" style={{ margin: "0 0 14px" }}>Anything you paid for the group: food, drinks, gas, tolls, ice. Add each one and we&apos;ll do the adding up. Settling up comes after the trip.</p>
          {p.expenses.length > 0 && (
            <ul className="list expenses">
              {p.expenses.map((e) => (
                <li key={e.id}>
                  <span>{e.note}</span>
                  <span className="amt">{usd(e.amount)}</span>
                  <form action={removeExpense}>
                    <input type="hidden" name="id" value={e.id} />
                    <ConfirmButton label="Remove" confirm={`Remove ${e.note}, ${usd(e.amount)}?`} />
                  </form>
                </li>
              ))}
              <li className="total"><strong>Total</strong><strong className="amt">{usd(total)}</strong></li>
            </ul>
          )}
          <AddExpense first={p.expenses.length === 0} />
        </section>
        <section className="block">
          <form action={signOut}><button className="btn ghost block-btn">Sign out</button></form>
        </section>
      </main>
      <TabBar admin={admin} />
    </>
  );
}
