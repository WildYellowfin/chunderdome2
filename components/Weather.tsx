import { tripForecast } from "@/lib/weather";

const label = (date: string) => `${new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })} ${Number(date.slice(8))}`;

// The Dillon Beach forecast for the trip days. Renders nothing until the trip is
// inside the forecast window, or if the forecast can't be fetched.
export default async function Weather() {
  const days = await tripForecast();
  if (!days?.length) return null;
  return (
    <section className="block">
      <div className="block-head"><h2 className="d d-m">Weather</h2><span className="mono faint">Dillon Beach</span></div>
      <div className="wx">
        {days.map((d) => (
          <div key={d.date}>
            <div className="mono faint">{label(d.date)}</div>
            <div className="wx-t"><b>{d.hi}°</b><span>{d.lo}°</span></div>
            <div className="wx-k"><span>Rain</span><span>{d.rain}%</span></div>
            <div className="wx-k"><span>Wind</span><span>{d.wind} mph</span></div>
          </div>
        ))}
      </div>
    </section>
  );
}
