import { redirect } from "next/navigation";
import { firebaseConfig, sessionPhone, verifyMode } from "@/lib/auth";
import { PhoneForm } from "@/components/LoginForm";
import Masthead from "@/components/Masthead";

export default async function LoginPage() {
  if (await sessionPhone()) redirect("/");
  return (
    <main className="page login" style={{ paddingBottom: 40 }}>
      <Masthead />
      <section className="block" style={{ borderTop: 0 }}>
        <h2 className="d d-l" style={{ marginBottom: 8 }}>Confirm your spot</h2>
        <p className="muted">Please complete this short form to help us plan transportation, gear and food.</p>
        <PhoneForm mode={verifyMode()} firebase={firebaseConfig()} />
      </section>
    </main>
  );
}
