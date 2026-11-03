import { tripForecast } from "@/lib/weather";

const day = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });

// The Dillon Beach forecast for the trip days, as a card printed onto the poster's top right,
// beside the dome and the rocket. Renders nothing until the trip is inside the forecast window,
// or if the forecast can't be fetched.
export default async function Weather() {
  const days = await tripForecast();
  if (!days?.length) return null;
  return (
    <section className="wx-card" aria-label="Dillon Beach weather">
      <div className="wx-head">Dillon Beach</div>
      <div className="wx-days">
        {days.map((d) => (
          <div key={d.date} className="wx-day">
            <div className="wx-d">{day(d.date)} {Number(d.date.slice(8))}</div>
            <div className="wx-t"><b>{d.hi}°</b><span>{d.lo}°</span></div>
            <div className="wx-m"><span>Rain</span>{d.rain}%</div>
            <div className="wx-m"><span>Wind</span>{d.wind}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
