import Link from "next/link";
import { CodeForm } from "@/components/LoginForm";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ phone?: string }> }) {
  const { phone = "" } = await searchParams;
  return (
    <main className="section">
      <div className="wrap narrow">
        <div className="card">
          <h2>Check your texts</h2>
          <CodeForm phone={phone} />
          <p className="hint" style={{ marginTop: 16 }}><Link href="/login">Wrong number or no code? Start over.</Link></p>
        </div>
      </div>
    </main>
  );
}
