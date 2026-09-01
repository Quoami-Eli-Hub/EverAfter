"use client";
import {useState} from "react";

export function DemoRsvpForm(){
  const[done,setDone]=useState(false);
  if(done)return <div className="rsvp-success feedback-stacked" role="status"><b>Thank you for responding.</b><span>Your RSVP has been recorded for this preview.</span></div>;
  return <form onSubmit={event=>{event.preventDefault();setDone(true)}}><input aria-label="Full name" placeholder="Your full name" required/><input aria-label="Phone number" placeholder="Phone number" required/><select aria-label="Attendance" defaultValue="" required><option value="" disabled>Will you attend?</option><option>Joyfully accepts</option><option>Regretfully declines</option></select><select aria-label="Additional guests" defaultValue="0"><option value="0">No additional guests</option><option>1 additional guest</option><option>2 additional guests</option></select><button>Send my RSVP</button></form>;
}

export function DemoTributeForm(){
  const[done,setDone]=useState(false);
  if(done)return <div className="rsvp-success feedback-stacked" role="status"><b>Thank you for sharing this memory.</b><span>Your tribute has been submitted for family approval.</span></div>;
  return <form onSubmit={event=>{event.preventDefault();setDone(true)}}><input aria-label="Full name" placeholder="Your full name" required/><textarea aria-label="Tribute" placeholder="Your memory or message" required minLength={10}/><button>Submit for review</button></form>;
}

export function DemoDownloadButton(){
  function download(){const blob=new Blob(["EVERAFTER PREVIEW\n\nSample funeral programme\nOwner-controlled document download preview."],{type:"text/plain"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download="sample-funeral-programme.txt";link.click();URL.revokeObjectURL(url)}
  return <button type="button" onClick={download}>Download ↓</button>;
}
