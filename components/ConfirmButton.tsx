"use client";
export default function ConfirmButton({ label, confirm }: { label: string; confirm: string }) {
  return (
    <button type="submit" className="btn small ghost" onClick={(e) => { if (!window.confirm(confirm)) e.preventDefault(); }}>{label}</button>
  );
}
