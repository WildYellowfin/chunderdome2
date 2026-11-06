import { requireOnboarded } from "@/lib/auth";
import { db } from "@/lib/db";
import { seatCount } from "@/lib/logistics";
import ProfileForm from "@/components/ProfileForm";

export default async function EditPage() {
  const { profile } = await requireOnboarded();
  const people = (await db.listProfiles()).filter((p) => p.onboardedAt);
  return <ProfileForm initial={profile} firstTime={false} seats={seatCount(people, profile.phone)} />;
}
