"use client";
import { useOptimistic, useTransition } from "react";
import { togglePacked } from "@/app/actions";
import type { PackItem } from "@/lib/packing";

export default function PackingList({ items, packed }: { items: PackItem[]; packed: string[] }) {
  const [optimistic, setOptimistic] = useOptimistic(new Set(packed), (s: Set<string>, a: { id: string; done: boolean }) => {
    const n = new Set(s);
    if (a.done) n.add(a.id); else n.delete(a.id);
    return n;
  });
  const [, start] = useTransition();
  const done = items.filter((i) => optimistic.has(i.id)).length;
  const sections = [...new Set(items.map((i) => i.section))];

  return (
    <>
      <section className="block" style={{ borderTop: 0 }}>
        <div className="block-head">
          <h1 className="d d-l">{done === items.length ? "Packed." : "Pack list"}</h1>
          <span className="d d-m">{done}<span className="faint">/{items.length}</span></span>
        </div>
        <div className="meter"><div style={{ width: `${(done / Math.max(1, items.length)) * 100}%` }} /></div>
        <p className="muted" style={{ margin: "12px 0 0", fontSize: 15 }}>Built from your answers. Cold nights, damp mornings, sand in everything.</p>
      </section>
      {sections.map((s) => (
        <section className="block" key={s}>
          <h2 className="d d-s" style={{ marginBottom: 4 }}>{s}</h2>
          {items.filter((i) => i.section === s).map((i) => {
            const on = optimistic.has(i.id);
            return (
              <label key={i.id} className={`check ${on ? "done" : ""}`}>
                <input type="checkbox" checked={on} onChange={(e) => {
                  const v = e.target.checked;
                  start(async () => { setOptimistic({ id: i.id, done: v }); await togglePacked(i.id, v); });
                }} />
                <span className="box" aria-hidden />
                <span><span className="lbl" style={{ fontWeight: 600 }}>{i.label}</span>{i.hint && <span className="hint" style={{ display: "block", marginTop: 2 }}>{i.hint}</span>}</span>
              </label>
            );
          })}
        </section>
      ))}
    </>
  );
}
