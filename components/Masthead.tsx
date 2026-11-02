import Countdown from "./Countdown";
import MapArt from "./MapArt";
import { TRIP } from "@/lib/trip";

export default function Masthead() {
  return (
    <header>
      <div className="mast">
        <div className="meta mono"><span>Dillon Beach, CA</span><span>Nov 13–15 · 2026</span></div>
        <h1 className="d d-xl"><span style={{ whiteSpace: "nowrap", color: "inherit" }}>Chunderdome</span> <span>II</span></h1>
        <p className="sub">{TRIP.tagline}</p>
        <MapArt />
      </div>
      <div className="ticket">
        <div><div className="mono faint">Depart SF</div><div className="big">Fri 6 PM</div><div>Nov 13</div></div>
        <div><div className="mono faint">Home by</div><div className="big">Sun 1 PM</div><div>Nov 15</div></div>
      </div>
      <Countdown to={TRIP.departISO} />
    </header>
  );
}
