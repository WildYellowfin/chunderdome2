import Countdown from "./Countdown";
import MapArt from "./MapArt";
import Weather from "./Weather";
import { TRIP } from "@/lib/trip";

// The poster carries the title lettering, so the masthead is just the poster
// plus the ticket stub and countdown.
export default function Masthead() {
  return (
    <header>
      <h1 className="sr-only">Chunderdome II · Dillon Beach · Nov 13–15, 2026</h1>
      <MapArt><Weather /></MapArt>
      <div className="ticket">
        <div><div className="mono faint">Depart SF</div><div className="big">Fri 6 PM</div><div>Nov 13</div></div>
        <div><div className="mono faint">Home by</div><div className="big">Sun 1 PM</div><div>Nov 15</div></div>
      </div>
      <Countdown to={TRIP.departISO} />
    </header>
  );
}
