import Image from "next/image";
import Link from "next/link";

const features = [
  ["Create one account", "Sign in with email or Google and create one wedding or memorial event."],
  ["Build in the dashboard", "Add the story, schedule, venues, RSVP settings, tributes, photos and documents."],
  ["Publish one simple link", "Share your event address. Public pages can also appear in Google search."],
  ["Guests respond", "Visitors open the link, get directions and RSVP with their name, phone and party size."],
  ["You stay in control", "Only the owner uploads. You choose privacy and whether files can be downloaded."],
  ["Keep it after the event", "Turn the same page into a gallery or lasting memorial without changing its link."],
];

export default function Home() {
  return <main>
    <section className="hero shell">
      <nav className="topbar"><Link className="brand" href="/"><span>ev.</span> EverAfter</Link><div className="navlinks"><Link href="#how">How it works</Link><Link href="/demo/wedding">Wedding demo</Link><Link href="/demo/memorial">Memorial demo</Link></div><Link className="button button-dark button-small" href="/onboarding">Create your page</Link></nav>
      <div className="hero-grid">
        <div className="hero-copy"><p className="eyebrow">One page. Every meaningful moment.</p><h1>Gather every detail of a day that matters.</h1><p className="lead">Create a thoughtful home for your wedding or memorial—beautifully designed, easy to share, and entirely yours.</p><div className="button-row"><Link className="button button-coral" href="/onboarding">Create an event page <span>↗</span></Link><Link className="text-link" href="#examples">Explore examples ↓</Link></div><div className="trust-row"><span>✓ No technical skills needed</span><span>✓ Your content, your control</span></div></div>
        <div className="hero-art" aria-label="Wedding page preview"><div className="arch arch-back"/><div className="arch arch-front"><Image className="photo-wash" src="/placeholders/wedding-couple.png" alt="Fictional Ghanaian couple on their wedding day" fill priority sizes="(max-width: 850px) 80vw, 35vw"/><div className="invite-card"><small>WE&apos;RE GETTING MARRIED</small><strong>Ama <i>&amp;</i> Kojo</strong><span>12 · 12 · 2026 · ACCRA</span></div></div><div className="floating-card rsvp-card"><b>RSVP received</b><span>Akosua + 2 guests</span></div><div className="floating-card date-card"><b>12</b><span>DEC<br/>2026</span></div></div>
      </div>
    </section>
    <section id="how" className="soft-section"><div className="shell"><p className="eyebrow centered">How everything works together</p><h2 className="section-title">One account manages one event.<br/>One link welcomes every guest.</h2><div className="feature-grid workflow-grid">{features.map(([title,body],i)=><article className="feature" key={title}><span>0{i+1}</span><h3>{title}</h3><p>{body}</p></article>)}</div></div></section>
    <section id="examples" className="examples shell"><div className="example-heading"><div><p className="eyebrow">Two moments, thoughtfully distinct</p><h2>A page that feels right.</h2></div><p>Choose an experience designed for your occasion, then make it your own with curated colors, type and layouts.</p></div><div className="example-grid"><Link href="/demo/wedding" className="example-card wedding-card"><span className="card-tag">WEDDING</span><div><p>YOU&apos;RE INVITED</p><h3>Abena <i>&amp;</i> Kwame</h3><span>View wedding experience →</span></div></Link><Link href="/demo/memorial" className="example-card memorial-card"><span className="card-tag">MEMORIAL</span><div><p>IN LOVING MEMORY</p><h3>Kofi Mensah</h3><span>View memorial experience →</span></div></Link></div></section>
    <footer className="footer shell"><Link className="brand" href="/"><span>ev.</span> EverAfter</Link><p>Thoughtful pages for meaningful gatherings.</p><p>V1 preview · Placeholder brand and people</p></footer>
  </main>;
}
