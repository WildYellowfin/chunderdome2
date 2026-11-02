"use client";
import { useEffect, useState } from "react";

export default function Countdown({ to }: { to: string }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = now === null ? null : Math.max(0, target - now);
  const parts = diff === null
    ? ["–", "–", "–", "–"]
    : [Math.floor(diff / 86400000), Math.floor((diff / 3600000) % 24), Math.floor((diff / 60000) % 60), Math.floor((diff / 1000) % 60)].map((n) => String(n).padStart(2, "0"));
  if (diff === 0) return <div className="count"><div><b>WE&apos;RE HERE</b></div></div>;
  return (
    <div className="count" role="timer" aria-label="Time until departure">
      {["Days", "Hrs", "Min", "Sec"].map((l, i) => (
        <div key={l}><b>{parts[i]}</b><span>{l}</span></div>
      ))}
    </div>
  );
}
