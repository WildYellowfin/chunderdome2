"use client";
import { assignRide } from "@/app/actions";

export default function AssignSelect({ phone, current, drivers }: { phone: string; current: string | null; drivers: { phone: string; label: string }[] }) {
  return (
    // Keyed on the saved value: React resets a form after its action, which would otherwise snap the select back to its first value.
    <form action={assignRide} key={current ?? ""}>
      <input type="hidden" name="phone" value={phone} />
      <select name="driver" defaultValue={current ?? ""} onChange={(e) => e.currentTarget.form?.requestSubmit()} aria-label="Assign to car" >
        <option value="">Unassigned</option>
        {drivers.map((d) => <option key={d.phone} value={d.phone}>{d.label}</option>)}
      </select>
    </form>
  );
}
