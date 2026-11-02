import { requireOnboarded } from "@/lib/auth";
import ProfileForm from "@/components/ProfileForm";

export default async function EditPage() {
  const { profile } = await requireOnboarded();
  return <ProfileForm initial={profile} firstTime={false} />;
}
