"use client";

import { useEffect, useRef, useState } from "react";
import type { InvitationSettings } from "@/lib/invitation";
import "./invitation-cover.css";

type Props = { settings: InvitationSettings; names: string; date: string; slug?: string; preview?: boolean; memorial?: boolean };

export function InvitationCover({ settings, names, date, slug, preview = false, memorial = false }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [opening, setOpening] = useState(false);
  const [opened, setOpened] = useState(false);
  const title = settings.names || names;
  const initials = memorial ? title.replace(/^remembering\s+/i, "").split(/\s+/).filter(Boolean).map(name=>Array.from(name)[0]).filter((_,index,all)=>index===0||index===all.length-1).join(" · ") : title.split(/\s*(?:&|\band\b)\s*/i).map(name => Array.from(name.trim())[0] || "").slice(0, 2).join(" · ");

  useEffect(() => {
    if (preview) return;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element?.close();
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = previousOverflow; if (timer.current) clearTimeout(timer.current); };
  }, [preview, settings.enabled, slug]);

  function open() {
    if (opening) return;
    setOpening(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timer.current = setTimeout(() => {
      setOpened(true);
      if (!preview) {
        dialog.current?.close();
        document.body.style.overflow = "";
        document.querySelector<HTMLElement>(".hero-content h1, .wedding-hero h1, .mem-hero h1")?.focus({ preventScroll: true });
        if(window.location.hash){try{document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView();}catch{}}
      }
    }, reduced ? 0 : 950);
  }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const card = <div className={`invitation-stage${opening ? " invitation-opening" : ""}`}>
    <div className="invitation-door invitation-door-left"/><div className="invitation-door invitation-door-right"/>
    <div className="invitation-card">
      <p className="invitation-eyebrow">{memorial?"An invitation to remember":"A day to remember"}</p>
      {settings.emblem !== "none" && <div className="invitation-seal" aria-hidden="true">{settings.emblem === "flower" ? "✺" : initials}</div>}
      <h2>{title}</h2><div className="invitation-rule"/>
      <p className="invitation-date">{settings.date || date}</p>
      <p className="invitation-message">{settings.message}</p>
      <button ref={button} type="button" onClick={open} disabled={opening}>{settings.button}<span aria-hidden="true"> ↗</span></button>
      <small>{memorial?"Together, we honour a life well lived":"With love, you are invited"}</small>
    </div>
  </div>;
  if (preview) return <div className="invitation-preview">{opened ? <div className="invitation-revealed"><p>Welcome to our gathering</p><h2>{title}</h2><p>The event page is revealed here.</p></div> : card}</div>;
  return <><noscript><style>{".invitation-dialog{display:none!important}"}</style></noscript><dialog open={!opened} ref={dialog} className="invitation-dialog" aria-label={`Invitation to ${title}`} onCancel={event => { event.preventDefault(); open(); }}>{card}</dialog></>;
}
