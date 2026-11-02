import Link from "next/link";
import { CodeForm } from "@/components/LoginForm";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ phone?: string }> }) {
  const { phone = "" } = await searchParams;
  return (
    <main className="page">
      <section className="block" style={{ borderTop: 0, paddingTop: 48 }}>
        <h1 className="d d-l" style={{ marginBottom: 16 }}>Check your texts</h1>
        <CodeForm phone={phone} />
        <p className="hint" style={{ marginTop: 20 }}><Link href="/login">Wrong number, or no code? Start over.</Link></p>
      </section>
    </main>
  );
}
