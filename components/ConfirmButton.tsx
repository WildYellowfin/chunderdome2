"use client";
export default function ConfirmButton({ label, confirm }: { label: string; confirm: string }) {
  return (
    <button type="submit" className="linkbtn mono faint" onClick={(e) => { if (!window.confirm(confirm)) e.preventDefault(); }}>{label}</button>
  );
}
