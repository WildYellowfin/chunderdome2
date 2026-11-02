import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import ProfileForm from "@/components/ProfileForm";

export default async function OnboardingPage() {
  const { profile } = await requireUser();
  if (profile.onboardedAt) redirect("/me");
  return (
    <main className="section">
      <div className="wrap narrow">
        <div className="kicker">Welcome to</div>
        <h1 style={{ fontSize: "2.4rem", marginBottom: 6 }}>Chunderdome II</h1>
        <p className="muted">A few quick questions so we can sort rides, gear, and food.</p>
        <ProfileForm initial={profile} firstTime />
      </div>
    </main>
  );
}
