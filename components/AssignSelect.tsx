"use client";
import { assignRide } from "@/app/actions";

export default function AssignSelect({ phone, current, drivers }: { phone: string; current: string | null; drivers: { phone: string; label: string }[] }) {
  return (
    <form action={assignRide}>
      <input type="hidden" name="phone" value={phone} />
      <select name="driver" defaultValue={current ?? ""} onChange={(e) => e.currentTarget.form?.requestSubmit()} aria-label="Assign to car" style={{ padding: "6px 10px", minWidth: 160 }}>
        <option value="">Unassigned</option>
        {drivers.map((d) => <option key={d.phone} value={d.phone}>{d.label}</option>)}
      </select>
    </form>
  );
}
