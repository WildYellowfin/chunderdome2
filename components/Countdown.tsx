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
  if (now === null) return <div className="countdown" aria-hidden />;
  const diff = Math.max(0, target - now);
  if (diff === 0) return <p className="tag">It has begun. 🏕️</p>;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  const s = Math.floor((diff / 1000) % 60);
  return (
    <div className="countdown" role="timer" aria-label={`${d} days ${h} hours until departure`}>
      <div><b>{d}</b><span>days</span></div>
      <div><b>{h}</b><span>hours</span></div>
      <div><b>{m}</b><span>min</span></div>
      <div><b>{s}</b><span>sec</span></div>
    </div>
  );
}
