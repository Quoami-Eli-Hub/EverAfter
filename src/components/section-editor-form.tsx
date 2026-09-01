"use client";

import {FormEvent, useEffect, useState} from "react";
import {updateSection} from "@/app/dashboard/actions";

type SectionEditorFormProps={
  id:number;
  label:string;
  initialHeading:string;
  initialBody:string;
  initialVisible:boolean;
};

export function SectionEditorForm({id,label,initialHeading,initialBody,initialVisible}:SectionEditorFormProps){
  const[heading,setHeading]=useState(initialHeading);
  const[body,setBody]=useState(initialBody);
  const[visible,setVisible]=useState(initialVisible);
  const[busy,setBusy]=useState(false);
  const[message,setMessage]=useState("");
  const[failed,setFailed]=useState(false);
  const[savedHeading,setSavedHeading]=useState(initialHeading);
  const[savedBody,setSavedBody]=useState(initialBody);
  const[savedVisible,setSavedVisible]=useState(initialVisible);
  const dirty=heading!==savedHeading||body!==savedBody||visible!==savedVisible;

  useEffect(()=>{
    const warn=(event:BeforeUnloadEvent)=>{if(dirty){event.preventDefault();event.returnValue=""}};
    window.addEventListener("beforeunload",warn);
    return()=>window.removeEventListener("beforeunload",warn);
  },[dirty]);

  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setFailed(false);

    const formData=new FormData(event.currentTarget);
    try{
      const result=await updateSection(formData);
      setFailed(!result.ok);
      setMessage(result.message);
      if(result.ok){setSavedHeading(heading);setSavedBody(body);setSavedVisible(visible)}
    }catch{
      setFailed(true);
      setMessage("The save could not be completed. Check your connection and try again.");
    }finally{
      setBusy(false);
    }
  }

  return <form onSubmit={save} className="panel edit-form">
    <input type="hidden" name="id" value={id}/>
    <div>
      <b>{label} {dirty&&<small className="unsaved-badge">Unsaved changes</small>}</b>
      <label className="switch-label"><input type="checkbox" name="visible" checked={visible} onChange={event=>setVisible(event.target.checked)}/> Visible</label>
    </div>
    <input name="heading" value={heading} onChange={event=>setHeading(event.target.value)} placeholder="Section heading"/>
    <textarea name="body" value={body} onChange={event=>setBody(event.target.value)} placeholder="Write this section's content..."/>
    <button className="button button-dark" disabled={busy||!dirty}>{busy?"Saving...":dirty?"Save section":"Saved"}</button>
    {message&&<small role="status" className={failed?"auth-message":"rsvp-success"}>{message}</small>}
  </form>;
}
