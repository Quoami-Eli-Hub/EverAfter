import Image from "next/image";
import Link from "next/link";
import { DemoDownloadButton, DemoTributeForm } from "@/components/demo-actions";

const program = [["Friday · 6:00 PM","Family gathering & wake","Family Residence, East Legon"],["Saturday · 8:00 AM","Funeral service","St. Paul’s Church, Accra"],["Sunday · 9:30 AM","Thanksgiving service","St. Paul’s Church, Accra"]];

export default function Memorial() {
  return <main className="memorial-demo">
    <header className="mem-nav"><Link href="/">EverAfter</Link><nav><a href="#life">His life</a><a href="#service">Service</a><a href="#tributes">Tributes</a></nav><a href="#tribute">Leave a tribute</a></header>
    <section className="mem-hero"><div className="mem-portrait"><Image src="/placeholders/memorial-portrait.png" alt="Fictional memorial portrait used as a page placeholder" fill priority sizes="(max-width: 850px) 90vw, 40vw"/></div><div><p>IN LOVING MEMORY OF</p><h1>Kofi<br/>Mensah</h1><div className="life-dates"><span>1948</span><i>—</i><span>2026</span></div><blockquote>“A generous heart, a steady hand, and a life that made room for everyone.”</blockquote></div></section>
    <section id="life" className="life-story"><div><p className="mem-kicker">A LIFE WELL LIVED</p><h2>He taught us to live with kindness.</h2></div><div><p>Kofi was a beloved husband, father, grandfather, mentor and friend. He carried a quiet strength that made every person feel seen.</p></div></section>
    <section id="service" className="mem-program"><p className="mem-kicker">FUNERAL ARRANGEMENTS</p><h2>Join us in remembrance.</h2>{program.map(p=><article key={p[0]}><strong>{p[0]}</strong><div><h3>{p[1]}</h3><p>{p[2]}</p></div><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p[2])}`} target="_blank" rel="noreferrer">Directions ↗</a></article>)}<div className="document-card"><span>PDF</span><div><b>Funeral programme</b><small>Sample document</small></div><DemoDownloadButton/></div></section>
    <section id="tributes" className="tributes"><p className="mem-kicker">WORDS OF REMEMBRANCE</p><h2>Held in many hearts.</h2><div className="tribute-grid"><blockquote>“Uncle Kofi’s wisdom stayed with you.”<cite>— Ama B.</cite></blockquote><blockquote>“A wonderful mentor and a true gentleman.”<cite>— Daniel O.</cite></blockquote></div></section>
    <section id="tribute" className="tribute-form"><p className="mem-kicker">SHARE A MEMORY</p><h2>Leave a tribute.</h2><p>Submissions are reviewed before appearing.</p><DemoTributeForm/></section>
    <footer className="mem-footer"><h3>KM</h3><p>In loving memory · 1948–2026</p><Link href="/dashboard">Family dashboard</Link></footer>
  </main>;
}
