import type {Metadata} from "next";
import Link from "next/link";
import Image from "next/image";
import {notFound} from "next/navigation";
import {cookies} from "next/headers";
import {eventAccessCookie} from "@/lib/event-access";
import {createClient,createEventAccessClient} from "@/lib/supabase/server";
import {submitRsvp,submitTribute,unlockEvent} from "./actions";
import "./public-event.css";

type Props={params:Promise<{slug:string}>;searchParams:Promise<{rsvp?:string;tribute?:string;access?:string}>};
type SectionBody={text?:string};

async function getEvent(slug:string,token?:string){
  const supabase=token?await createEventAccessClient(token):await createClient();
  const{data:event}=await supabase.from("events").select("*").eq("slug",slug).maybeSingle();
  if(!event)return null;
  const guestCanRead=event.status==="published"&&(event.visibility==="public"||(event.visibility==="protected"&&Boolean(token)));
  if(!guestCanRead){const{data:{user}}=await supabase.auth.getUser();if(!user)return null}
  const results=await Promise.all([
    supabase.from("event_sections").select("*").eq("event_id",event.id).eq("is_visible",true).order("sort_order"),
    supabase.from("schedule_items").select("*").eq("event_id",event.id).eq("is_public",true).order("starts_at"),
    supabase.from("venues").select("*").eq("event_id",event.id).eq("is_public",true).order("sort_order"),
    supabase.from("albums").select("*").eq("event_id",event.id).eq("is_public",true).order("sort_order"),
    supabase.from("media").select("*").eq("event_id",event.id).eq("is_public",true).order("sort_order"),
    supabase.from("documents").select("*").eq("event_id",event.id).eq("is_public",true).order("created_at"),
    supabase.from("tributes").select("*").eq("event_id",event.id).eq("status","approved").order("created_at",{ascending:false})
  ]);
  const sections=results[0].data??[],schedule=results[1].data??[],venues=results[2].data??[],albums=results[3].data??[],media=results[4].data??[],documents=results[5].data??[],tributes=results[6].data??[];
  const paths=[...media.map(x=>x.storage_path),...documents.map(x=>x.storage_path)];
  const signed=paths.length?(await supabase.storage.from("event-media").createSignedUrls(paths,3600)).data??[]:[];
  const urls=new Map(signed.map(x=>[x.path,x.signedUrl]));
  return{event,sections,schedule,venues,albums,media:media.map(x=>({...x,url:urls.get(x.storage_path)??""})),documents:documents.map(x=>({...x,url:urls.get(x.storage_path)??""})),tributes};
}

export async function generateMetadata({params}:Props):Promise<Metadata>{const{slug}=await params;const supabase=await createClient();const{data:gate}=await supabase.rpc("get_event_gate",{p_slug:slug}).maybeSingle();if(!gate)return{title:"Event not found",robots:{index:false,follow:false}};return{title:`${gate.title} · EverAfter`,description:`Event details, programme, gallery and guest responses for ${gate.title}.`,robots:{index:gate.visibility==="public",follow:gate.visibility==="public"},alternates:{canonical:`/${slug}`}}}

export default async function PublicEventPage({params,searchParams}:Props){
  const{slug}=await params,query=await searchParams;const token=(await cookies()).get(eventAccessCookie(slug))?.value;const data=await getEvent(slug,token);
  if(!data){const supabase=await createClient();const{data:gate}=await supabase.rpc("get_event_gate",{p_slug:slug}).maybeSingle();if(!gate)notFound();return <main className={`access-page access-${gate.event_type}`}><section className="access-card"><Link className="brand" href="/"><span>ev.</span> EverAfter</Link><p className="eyebrow">Private invitation</p><h1>{gate.title}</h1><p>This event is password protected. Enter the password shared by the event owner.</p>{query.access&&<div className="auth-message">That password was not accepted. Please try again.</div>}<form action={unlockEvent}><input type="hidden" name="slug" value={slug}/><label>Event password<input name="password" type="password" required minLength={8} maxLength={128} autoComplete="current-password" autoFocus/></label><button className="button button-dark">Open event page</button></form></section></main>}

  const{event,sections,schedule,venues,albums,media,documents,tributes}=data;
  const memorial=event.event_type==="memorial",rsvpClosed=Boolean(event.rsvp_deadline&&new Date(event.rsvp_deadline)<new Date());
  const sectionMap=new Map(sections.map(section=>[section.section_key,section]));
  const body=(key:string)=>String((sectionMap.get(key)?.body as SectionBody)?.text??"");
  const heading=(key:string,fallback:string)=>sectionMap.get(key)?.heading||fallback;
  const weddingDate=event.event_date?new Date(`${event.event_date}T12:00:00`):null;
  const formattedDate=weddingDate?new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"long",year:"numeric"}).format(weddingDate):"Date to be confirmed";
  const primaryVenue=venues[0];
  const infoKeys=(memorial?["family","directions","dress_code","donations","contact"]:["dress_code","accommodation","travel","gift_registry","contact"]).filter(key=>body(key));
  const shareText=encodeURIComponent(`${event.title} · ${formattedDate} · ${process.env.NEXT_PUBLIC_SITE_URL??"http://localhost:3000"}/${slug}`);

  const localShowcase=!memorial?event.id===8?{hero:"/events/quoami-harry/hero.png",story:"/events/quoami-harry/story.png",reception:"/events/quoami-harry/reception.png"}:event.id===5?{hero:"/showcase/wedding-hero.png",story:"/showcase/wedding-story.png",reception:"/showcase/wedding-reception.png"}:null:null;
  const showcase=Boolean(localShowcase);
  const heroUrl=media[0]?.url??localShowcase?.hero??null;
  const storyUrl=media[1]?.url??localShowcase?.story??null;

  return <main className={`live-event live-${memorial?"memorial":"wedding"} theme-${event.theme_key} palette-${event.color_key} font-${event.font_key}`}>
    <header className="live-nav"><Link href="/">EverAfter</Link><nav><a href="#story">Story</a><a href="#programme">Programme</a>{(media.length>0||!memorial)&&<a href="#gallery">Gallery</a>}<a href="#messages">{memorial?"Tributes":"Congratulations"}</a></nav><a className="nav-rsvp" href="#rsvp">RSVP</a></header>

    <section className="live-hero">
      {heroUrl&&<Image className="live-hero-image" src={heroUrl} alt={media[0]?.caption||media[0]?.original_name||"Event cover photograph"} fill priority sizes="100vw"/>}
      <div className="hero-shade"/>
      <div className="hero-content"><p>{memorial?"IN LOVING MEMORY":"SAVE THE DATE"}</p><h1>{event.title}</h1><span>{formattedDate}{primaryVenue?` · ${primaryVenue.name}`:""}</span><div className="hero-actions"><a href="#programme">Explore the day</a>{event.rsvp_enabled&&!rsvpClosed&&<a className="hero-primary" href="#rsvp">Confirm attendance</a>}</div></div>
      <a className="hero-scroll" href="#story">Scroll to discover <span>↓</span></a>
    </section>

    <section className="event-snapshot" aria-label="Event overview"><div><small>{memorial?"Remembering":"The celebration"}</small><strong>{formattedDate}</strong></div><div><small>Location</small><strong>{primaryVenue?.name??"Accra, Ghana"}</strong></div><div><small>Guest response</small><strong>{rsvpClosed?"Responses closed":"RSVP now open"}</strong></div><div><small>Guest guide</small><strong>Everything in one place</strong></div></section>

    <section id="story" className="live-story">
      {!memorial&&<div className={`story-visual${storyUrl?"":" story-placeholder"}`}>{storyUrl&&<Image src={storyUrl} alt={media[1]?.caption||media[1]?.original_name||"Event story photograph"} fill sizes="(max-width: 800px) 100vw, 46vw"/>}</div>}
      <div className="story-copy"><p className="event-kicker">{memorial?"A LIFE REMEMBERED":"OUR STORY"}</p><h2>{heading("our_story",memorial?"A story worth remembering":"The beginning of forever")}</h2><p>{body("our_story")||event.excerpt}</p>{body("announcement")&&<blockquote>“{body("announcement")}”</blockquote>}<span>{memorial?"Shared with love by the family":`With love, ${event.title}`}</span></div>
    </section>

    <section id="programme" className="live-programme"><div className="section-heading"><p className="event-kicker">THE GUEST GUIDE</p><h2>{memorial?"Programme and locations":"One beautiful day, clearly planned"}</h2><p>Times, places and the details guests need—kept together and always current.</p></div><div className="programme-list">{schedule.length?schedule.map((item,index)=><article key={item.id}><div className="programme-number">{String(index+1).padStart(2,"0")}</div><time>{new Intl.DateTimeFormat("en-GB",{weekday:"short",hour:"2-digit",minute:"2-digit",timeZone:event.timezone}).format(new Date(item.starts_at))}</time><div><h3>{item.title}</h3><p>{item.description||"Join us as the celebration unfolds."}</p></div><span>{venues.find(v=>v.id===item.venue_id)?.name||"Venue to be confirmed"}</span></article>):<p className="empty-state">The final programme will be shared here soon.</p>}</div>
      {primaryVenue&&<div className="venue-feature"><div><p className="event-kicker">GETTING THERE</p><h3>{primaryVenue.name}</h3><p>{primaryVenue.address}</p>{primaryVenue.directions&&<small>{primaryVenue.directions}</small>}</div>{primaryVenue.map_url&&<a href={primaryVenue.map_url} target="_blank" rel="noreferrer">Open in Google Maps ↗</a>}</div>}
    </section>

    {infoKeys.length>0&&<section className="guest-notes"><div className="section-heading"><p className="event-kicker">BEFORE YOU ARRIVE</p><h2>Thoughtful details for every guest</h2></div><div className="guest-note-grid">{infoKeys.map((key,index)=><article key={key}><span>{String(index+1).padStart(2,"0")}</span><h3>{heading(key,key.replaceAll("_"," "))}</h3><p>{body(key)}</p></article>)}</div></section>}

    <section id="gallery" className="live-gallery"><div className="gallery-heading"><p className="event-kicker">{memorial?"MEMORIES":"THEIR STORY IN FRAMES"}</p><h2>{memorial?"Photos we hold close":"A glimpse of the celebration"}</h2><p>{media.length?"Moments shared by the event owner.":showcase?"A preview of how your photographs can come alive here.":"Photographs selected by the event owner will be shared here."}</p></div>{media.length?<div className="gallery-mosaic">{media.slice(0,6).map((item,index)=><figure className={`gallery-item gallery-item-${index+1}`} key={item.id}>{item.url&&<Image src={item.url} alt={item.caption??item.original_name} fill sizes="(max-width: 760px) 100vw, 40vw"/>}<figcaption>{item.caption}{event.allow_photo_downloads&&item.allow_download&&item.url&&<a href={item.url} download={item.original_name}>Download</a>}</figcaption></figure>)}</div>:localShowcase?<div className="gallery-mosaic showcase-mosaic"><figure className="gallery-item gallery-item-1"><Image src={localShowcase.hero} alt="Wedding portrait at sunset" fill sizes="60vw"/></figure><figure className="gallery-item gallery-item-2"><Image src={localShowcase.story} alt="Engagement portrait in a garden" fill sizes="40vw"/></figure><figure className="gallery-item gallery-item-3"><Image src={localShowcase.reception} alt="Wedding reception tablescape" fill sizes="40vw"/></figure></div>:<div className="gallery-awaiting"><span>01</span><p>Your gallery is ready for its first photograph.</p></div>}{albums.length>0&&<p className="album-note">{albums.length} {albums.length===1?"album":"albums"} prepared · More photographs can be added anytime</p>}</section>

    {memorial&&documents.length>0&&<section className="live-section alternate"><p className="event-kicker">PROGRAMMES & POSTERS</p><h2>Event documents</h2>{documents.map(doc=><article className="live-venue" key={doc.id}><b>{doc.title}</b><span>{doc.document_type}</span>{doc.allow_download&&doc.url&&<a href={doc.url} target="_blank" rel="noreferrer">View or download PDF ↗</a>}</article>)}</section>}

    {event.rsvp_enabled&&<section id="rsvp" className="live-rsvp"><div className="rsvp-copy"><p className="event-kicker">PLEASE RESPOND</p><h2>{rsvpClosed?"Responses are now closed":"Will you celebrate with us?"}</h2><p>Your response helps the couple and their planning team prepare a thoughtful experience for every guest.</p><div><span>Response deadline</span><b>{event.rsvp_deadline?new Intl.DateTimeFormat("en-GB",{dateStyle:"long"}).format(new Date(event.rsvp_deadline)):"Please respond when you can"}</b></div></div><div className="rsvp-card">{query.rsvp==="success"&&<div className="rsvp-success">Thank you. Your response has been received.</div>}{query.rsvp&&query.rsvp!=="success"&&<div className="auth-message">{query.rsvp==="closed"?"RSVPs are now closed.":"Please review your details and try again."}</div>}{rsvpClosed?<p>Contact the event owner if your plans have changed.</p>:<form action={submitRsvp}><input type="hidden" name="slug" value={slug}/><label>Your name<input name="guestName" placeholder="Full name" required minLength={2} maxLength={100}/></label><label>Phone number<input name="phone" type="tel" placeholder="e.g. +233 24 000 0000" required minLength={7} maxLength={24}/></label><label>Attendance<select name="attending" defaultValue="true"><option value="true">Joyfully accepts</option><option value="false">Regretfully declines</option></select></label><label>Party size<select name="partySize" defaultValue="1">{Array.from({length:event.max_party_size},(_,i)=><option key={i+1} value={i+1}>{i+1} {i?"people":"person"} total</option>)}</select></label><label className="rsvp-note">A note for the hosts<textarea name="note" maxLength={500} placeholder="Dietary needs or a warm note (optional)"/></label><button>Send my RSVP <span>→</span></button></form>}</div></section>}

    <section id="messages" className="live-messages"><div className="messages-heading"><p className="event-kicker">{memorial?"TRIBUTES":"WISH THEM WELL"}</p><h2>{memorial?"Share a memory":"Leave your congratulations"}</h2><p>{memorial?"Words of remembrance become part of the family’s lasting tribute.":"Add a warm message for the couple. Approved notes become part of their celebration."}</p></div><div className="messages-layout"><form action={submitTribute} className="message-form"><input type="hidden" name="slug" value={slug}/><label>Your name<input name="authorName" required minLength={2} maxLength={100} placeholder="Full name"/></label><label>Your message<textarea name="message" required minLength={10} maxLength={1500} placeholder={memorial?"Write your tribute or memory":"Write a congratulatory message for the couple"}/></label><button>Submit for approval →</button>{query.tribute==="success"&&<div className="rsvp-success">Thank you. Your {memorial?"tribute":"message"} will appear after approval.</div>}{query.tribute&&query.tribute!=="success"&&<div className="auth-message">Please review your message and try again.</div>}</form><div className="message-wall">{tributes.length?tributes.slice(0,4).map(tribute=><blockquote key={tribute.id}><p>“{tribute.message}”</p><cite>— {tribute.author_name}</cite></blockquote>):<blockquote><p>“Here’s to a lifetime of laughter, friendship and growing together.”</p><cite>— Your guests’ messages will appear here</cite></blockquote>}</div></div></section>

    <section className="share-invitation"><p>Keep everyone connected to the latest details</p><h2>Share this invitation with the people who matter.</h2><div><a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer">Share on WhatsApp</a><a href="#programme">View programme</a></div></section>
    <footer><div><b>{event.title}</b><span>{formattedDate}</span></div><nav><a href="#story">Story</a><a href="#programme">Programme</a><a href="#rsvp">RSVP</a></nav>{!event.branding_removed&&<span>Published with EverAfter</span>}</footer>
  </main>;
}
