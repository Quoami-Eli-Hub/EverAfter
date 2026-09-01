import Image from "next/image";
import Link from "next/link";
import {createClient} from "@/lib/supabase/server";

const features=[
  ["Create one account","Run one personal page or a full portfolio of client events."],
  ["Build in the dashboard","Add stories, schedules, venues, RSVPs, messages, photos and documents."],
  ["Invite your team","Give planners, contributors and reviewers their own secure access."],
  ["Publish one simple link","Every event keeps a memorable address that guests can revisit."],
  ["Guests respond","Visitors get directions, RSVP and engage with approved event content."],
  ["Keep it after the event","Turn the same page into a gallery or lasting memorial."],
];

export default async function Home(){
  const configured=Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const supabase=configured?await createClient():null;
  const{data:events}=supabase?await supabase.from("events").select("id,title,slug,event_type,event_date,excerpt,theme_key,color_key").eq("status","published").eq("visibility","public").order("event_date",{ascending:true,nullsFirst:false}).limit(24):{data:[]};
  const ids=(events??[]).map(event=>event.id);
  const{data:media}=ids.length&&supabase?await supabase.from("media").select("event_id,storage_path,caption").in("event_id",ids).eq("is_public",true).order("sort_order"):{data:[]};
  const firstMedia=new Map<number,{storage_path:string;caption:string|null}>();
  for(const item of media??[])if(!firstMedia.has(item.event_id))firstMedia.set(item.event_id,item);
  const paths=[...firstMedia.values()].map(item=>item.storage_path);
  const signed=paths.length&&supabase?(await supabase.storage.from("event-media").createSignedUrls(paths,3600)).data??[]:[];
  const urls=new Map(signed.map(item=>[item.path,item.signedUrl]));
  const fallback=(id:number,type:string)=>id===8?"/events/quoami-harry/hero.png":id===5?"/showcase/wedding-hero.png":type==="memorial"?"/placeholders/memorial-portrait.png":"/placeholders/wedding-couple.png";

  return <main>{!configured&&<div className="deployment-warning">Deployment setup is incomplete. Add the Supabase URL and publishable key in Vercel, then redeploy.</div>}
    <section className="hero shell">
      <nav className="topbar"><Link className="brand" href="/"><span>ev.</span> EverAfter</Link><div className="navlinks"><Link href="#how">How it works</Link><Link href="#live-events">Live events</Link><Link href="/demo/wedding">Wedding demo</Link><Link href="/demo/memorial">Memorial demo</Link></div><div className="topbar-actions"><Link className="signin-link" href="/login">Sign in</Link><Link className="button button-dark button-small" href="/onboarding">Create your page</Link></div></nav>
      <div className="hero-grid"><div className="hero-copy"><p className="eyebrow">One page. Every meaningful moment.</p><h1>Gather every detail of a day that matters.</h1><p className="lead">Create a thoughtful home for your wedding or memorial—beautifully designed, easy to share, and entirely yours.</p><div className="button-row"><Link className="button button-coral" href="/onboarding">Create an event page <span>↗</span></Link><Link className="text-link" href="#live-events">Discover live events ↓</Link></div><div className="trust-row"><span>✓ No technical skills needed</span><span>✓ Your content, your control</span></div></div><div className="hero-art" aria-label="Wedding page preview"><div className="arch arch-back"/><div className="arch arch-front"><Image className="photo-wash" src="/placeholders/wedding-couple.png" alt="Fictional Ghanaian couple on their wedding day" fill priority sizes="(max-width: 850px) 80vw, 35vw"/><div className="invite-card"><small>WE&apos;RE GETTING MARRIED</small><strong>Ama <i>&amp;</i> Kojo</strong><span>12 · 12 · 2026 · ACCRA</span></div></div><div className="floating-card rsvp-card"><b>RSVP received</b><span>Akosua + 2 guests</span></div><div className="floating-card date-card"><b>12</b><span>DEC<br/>2026</span></div></div></div>
    </section>
    <section id="how" className="soft-section"><div className="shell"><p className="eyebrow centered">How everything works together</p><h2 className="section-title">One account manages every event.<br/>One simple link welcomes each guest list.</h2><div className="feature-grid workflow-grid">{features.map(([title,body],index)=><article className="feature" key={title}><span>0{index+1}</span><h3>{title}</h3><p>{body}</p></article>)}</div></div></section>
    <section id="live-events" className="discovery-section"><div className="shell"><div className="discovery-heading"><div><p className="eyebrow">Published on EverAfter</p><h2>Gatherings worth discovering.</h2></div><p>Public event pages appear here as elegant adverts. Private, protected, draft and unpublished events are never listed.</p></div>{events?.length?<div className="discovery-grid">{events.map(event=>{const item=firstMedia.get(event.id);const image=item&&urls.get(item.storage_path)||fallback(event.id,event.event_type);return <Link className={`discovery-card discovery-${event.event_type} palette-ad-${event.color_key}`} href={`/${event.slug}`} key={event.id}><div className="discovery-image"><Image src={image} alt={item?.caption||`${event.title} event`} fill sizes="(max-width: 760px) 100vw, 42vw"/></div><div className="discovery-copy"><div><span>{event.event_type==="wedding"?"WEDDING":"MEMORIAL"}</span><span>{event.theme_key}</span></div><h3>{event.title}</h3><p>{event.excerpt||"Open the page for the full story, programme and guest information."}</p><b>{event.event_date?new Intl.DateTimeFormat("en-GB",{dateStyle:"long"}).format(new Date(`${event.event_date}T12:00:00`)):"Date to be announced"} <i>View event ↗</i></b></div></Link>})}</div>:<div className="discovery-empty"><h3>The first public gathering will appear here.</h3><p>Publish a public event to feature it automatically.</p></div>}</div></section>
    <section id="examples" className="examples shell"><div className="example-heading"><div><p className="eyebrow">Two moments, thoughtfully distinct</p><h2>A page that feels right.</h2></div><p>Choose an experience designed for your occasion, then make it your own with coordinated colours, type and layouts.</p></div><div className="example-grid"><Link href="/demo/wedding" className="example-card wedding-card"><span className="card-tag">WEDDING</span><div><p>YOU&apos;RE INVITED</p><h3>Abena <i>&amp;</i> Kwame</h3><span>View wedding experience →</span></div></Link><Link href="/demo/memorial" className="example-card memorial-card"><span className="card-tag">MEMORIAL</span><div><p>IN LOVING MEMORY</p><h3>Kofi Mensah</h3><span>View memorial experience →</span></div></Link></div></section>
    <footer className="footer shell"><Link className="brand" href="/"><span>ev.</span> EverAfter</Link><p>Thoughtful pages for meaningful gatherings.</p><nav><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/login">Sign in</Link></nav></footer>
  </main>;
}
