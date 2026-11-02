import Link from "next/link";
import { signOut } from "@/app/actions";

export default function TopBar({ admin }: { admin?: boolean }) {
  return (
    <header className="topbar">
      <div className="wrap">
        <Link href="/" className="brand">Chunderdome <b>II</b></Link>
        <nav className="nav">
          <Link href="/">Trip</Link>
          <Link href="/packing">Packing</Link>
          <Link href="/me">My info</Link>
          {admin && <Link href="/admin">Admin</Link>}
          <form action={signOut}><button type="submit">Sign out</button></form>
        </nav>
      </div>
    </header>
  );
}
