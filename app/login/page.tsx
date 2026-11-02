import { redirect } from "next/navigation";
import { sessionPhone, verifyMode } from "@/lib/auth";
import { PhoneForm } from "@/components/LoginForm";
import MapArt from "@/components/MapArt";
import Countdown from "@/components/Countdown";
import { TRIP } from "@/lib/trip";

export default async function LoginPage() {
  if (await sessionPhone()) redirect("/");
  return (
    <main>
      <section className="hero">
        <div className="wrap">
          <div className="eyebrow">Dillon Beach · Nov 13–15, 2026</div>
          <h1>Chunderdome <span className="numeral">II</span></h1>
          <p className="tag">{TRIP.tagline}</p>
          <Countdown to={TRIP.departISO} />
          <MapArt />
        </div>
      </section>
      <section className="section">
        <div className="wrap narrow">
          <div className="card">
            <h2>Sign in to claim your spot</h2>
            <p className="muted">Takes about three minutes. Tell us where you&apos;re leaving from, whether you have a car, and what gear you&apos;ve got.</p>
            <PhoneForm mode={verifyMode()} />
          </div>
        </div>
      </section>
    </main>
  );
}
