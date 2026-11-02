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
  const doneCount = items.filter((i) => optimistic.has(i.id)).length;
  const pct = Math.round((doneCount / Math.max(1, items.length)) * 100);
  const sections = [...new Set(items.map((i) => i.section))];

  return (
    <div className="stack">
      <div className="card">
        <div className="row spread"><b>{doneCount} of {items.length} packed</b><span className="muted">{pct === 100 ? "Ready to chunder. 🎉" : `${pct}%`}</span></div>
        <div className="progress" style={{ marginTop: 10 }}><div style={{ width: `${pct}%` }} /></div>
      </div>
      {sections.map((s) => (
        <div className="card" key={s}>
          <h3>{s}</h3>
          {items.filter((i) => i.section === s).map((i) => {
            const done = optimistic.has(i.id);
            return (
              <label key={i.id} className={`check ${done ? "done" : ""}`}>
                <input type="checkbox" checked={done} onChange={(e) => {
                  const v = e.target.checked;
                  start(async () => { setOptimistic({ id: i.id, done: v }); await togglePacked(i.id, v); });
                }} />
                <span><span className="lbl">{i.label}</span>{i.hint && <><br /><small className="muted">{i.hint}</small></>}</span>
              </label>
            );
          })}
        </div>
      ))}
    </div>
  );
}
