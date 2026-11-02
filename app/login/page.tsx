import { redirect } from "next/navigation";
import { sessionPhone, verifyMode } from "@/lib/auth";
import { PhoneForm } from "@/components/LoginForm";
import Masthead from "@/components/Masthead";

export default async function LoginPage() {
  if (await sessionPhone()) redirect("/");
  return (
    <main className="page" style={{ paddingBottom: 40 }}>
      <Masthead />
      <section className="block" style={{ borderTop: 0 }}>
        <h2 className="d d-l" style={{ marginBottom: 8 }}>Claim your spot</h2>
        <p className="muted">Sign in with your phone, then tell us where you&apos;re leaving from, whether you&apos;ve got a car, and what gear you have.</p>
        <PhoneForm mode={verifyMode()} />
      </section>
    </main>
  );
}
