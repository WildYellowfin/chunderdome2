import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { seatCount } from "@/lib/logistics";
import ProfileForm from "@/components/ProfileForm";

export default async function OnboardingPage() {
  const { profile } = await requireUser();
  if (profile.onboardedAt) redirect("/me");
  const people = (await db.listProfiles()).filter((p) => p.onboardedAt);
  return <ProfileForm initial={profile} firstTime seats={seatCount(people, profile.phone)} />;
}
