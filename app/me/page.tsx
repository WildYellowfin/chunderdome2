import { requireOnboarded } from "@/lib/auth";
import ProfileForm from "@/components/ProfileForm";
import TopBar from "@/components/TopBar";

export default async function MePage() {
  const { profile, admin } = await requireOnboarded();
  return (
    <>
      <TopBar admin={admin} />
      <main className="section">
        <div className="wrap narrow">
          <h2>Your info</h2>
          <p className="muted">Signed in as {profile.phone}. Change anything, any time.</p>
          <ProfileForm initial={profile} firstTime={false} />
        </div>
      </main>
    </>
  );
}
