import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import ProfileForm from "@/components/ProfileForm";

export default async function OnboardingPage() {
  const { profile } = await requireUser();
  if (profile.onboardedAt) redirect("/me");
  return <ProfileForm initial={profile} firstTime />;
}
