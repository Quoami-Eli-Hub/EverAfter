import Image from "next/image";
import Link from "next/link";
import { InvitationCover } from "@/components/invitation-cover";
import { invitationSettings } from "@/lib/invitation";
import "../../[slug]/public-event.css";

export default function InvitationDemo() {
  return <main className="live-event palette-champagne font-romantic">
    <InvitationCover settings={invitationSettings({ enabled: true })} names="Ama & Kojo" date="19 December 2026" slug="demo-invitation"/>
    <section className="live-hero"><Image className="live-hero-image" src="/showcase/wedding-hero.png" alt="Wedding couple at sunset" fill priority sizes="100vw"/><div className="hero-shade"/><div className="hero-content"><p>WE ARE GETTING MARRIED</p><h1 tabIndex={-1}>Ama & Kojo</h1><span>19 December 2026 · Accra, Ghana</span><div className="hero-actions"><Link href="/demo/wedding">Explore the wedding demo</Link><Link href="/dashboard/settings">Customize your invitation</Link></div></div></section>
  </main>;
}
