import { requireOnboarded } from "@/lib/auth";
import { packingList } from "@/lib/packing";
import PackingList from "@/components/PackingList";
import TopBar from "@/components/TopBar";

export default async function PackingPage() {
  const { profile, admin } = await requireOnboarded();
  return (
    <>
      <TopBar admin={admin} />
      <main className="section">
        <div className="wrap narrow">
          <div className="kicker">Your list</div>
          <h2>Packing for the Dome</h2>
          <p className="muted">Built from your answers. Cold nights, damp mornings, sand everywhere. Tick things off as they go in the bag.</p>
          <PackingList items={packingList(profile)} packed={profile.packed} />
        </div>
      </main>
    </>
  );
}
