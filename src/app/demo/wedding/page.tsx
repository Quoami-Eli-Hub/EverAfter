import Image from "next/image";
import Link from "next/link";
import { DemoRsvpForm } from "@/components/demo-actions";

const schedule = [["2:00 PM","The ceremony","Ridge Church, Accra"],["4:30 PM","Cocktails & photographs","The Garden Terrace, Accra"],["6:00 PM","Dinner & celebration","Grand Pavilion, Accra"]];

export default function Wedding() {
  return <main className="wedding-demo">
    <header className="event-nav"><Link href="/">EverAfter</Link><nav><a href="#story">Our story</a><a href="#details">Details</a><a href="#gallery">Gallery</a></nav><a className="event-button" href="#rsvp">RSVP</a></header>
    <section className="wedding-hero"><p>TOGETHER WITH THEIR FAMILIES</p><h1>Ama <i>&amp;</i> Kojo</h1><div className="hero-date"><span>12</span><b>DECEMBER<br/>2026</b></div><p>ACCRA · GHANA</p><a href="#story">SCROLL TO CELEBRATE ↓</a></section>
    <section id="story" className="story-section"><div className="story-photo"><Image src="/placeholders/wedding-couple.png" alt="Fictional wedding couple used as a page placeholder" fill sizes="(max-width: 850px) 90vw, 40vw"/></div><div><p className="event-kicker">HOW IT STARTED</p><h2>Two paths,<br/>one beautiful story.</h2><p>We met on a warm evening in Accra. What began with an easy conversation became a life filled with laughter, faith and a thousand small adventures.</p><b>— Ama &amp; Kojo</b></div></section>
    <section id="details" className="schedule-section"><p className="event-kicker">THE CELEBRATION</p><h2>Saturday, 12 December</h2><div className="schedule-list">{schedule.map(s=><article key={s[0]}><strong>{s[0]}</strong><div><h3>{s[1]}</h3><p>{s[2]}</p></div><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s[2])}`} target="_blank" rel="noreferrer">Map ↗</a></article>)}</div></section>
    <section id="gallery" className="w-gallery"><div><p className="event-kicker">OUR MOMENTS</p><h2>A glimpse of us.</h2><p>The owner creates albums and decides which photos guests may download.</p></div>{[1,2,3].map(i=><div className={`gallery-placeholder gp-${i}`} key={i}><Image src={i === 1 ? "/placeholders/wedding-couple.png" : "/placeholders/wedding-reception.png"} alt={i === 1 ? "Wedding portrait placeholder" : "Wedding reception placeholder"} fill sizes="(max-width: 850px) 50vw, 25vw"/></div>)}</section>
    <section id="rsvp" className="rsvp-section"><p className="event-kicker">KINDLY REPLY</p><h2>Will you join us?</h2><DemoRsvpForm/></section>
    <footer className="event-footer"><h3>A <i>&amp;</i> K</h3><p>12 · 12 · 2026</p><Link href="/dashboard">Owner dashboard</Link></footer>
  </main>;
}
