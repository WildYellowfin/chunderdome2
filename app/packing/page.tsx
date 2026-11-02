import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { packingList } from "@/lib/packing";
import PackingList from "@/components/PackingList";
import TabBar from "@/components/TabBar";

export default async function PackingPage() {
  const { profile, admin } = await requireOnboarded();
  return (
    <>
      <header className="topline"><Link href="/" className="brand">Chunderdome <span>II</span></Link><span className="mono faint">Packing</span></header>
      <main className="page">
        <PackingList items={packingList(profile)} packed={profile.packed} />
      </main>
      <TabBar admin={admin} />
    </>
  );
}
