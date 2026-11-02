const COLORS = ["#e8673c", "#2c7a80", "#3b3a6b", "#2f4a3a", "#c7861c", "#a2456b", "#4f6fb0", "#7a5a3a"];

export default function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (
    <span className="avatar" title={name} style={{ background: COLORS[h % COLORS.length], width: size, height: size }}>
      {initials}
    </span>
  );
}
