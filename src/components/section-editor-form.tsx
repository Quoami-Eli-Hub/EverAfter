"use client";

import {FormEvent, useState} from "react";
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
      <b>{label}</b>
      <label className="switch-label"><input type="checkbox" name="visible" checked={visible} onChange={event=>setVisible(event.target.checked)}/> Visible</label>
    </div>
    <input name="heading" value={heading} onChange={event=>setHeading(event.target.value)} placeholder="Section heading"/>
    <textarea name="body" value={body} onChange={event=>setBody(event.target.value)} placeholder="Write this section's content..."/>
    <button className="button button-dark" disabled={busy}>{busy?"Saving...":"Save section"}</button>
    {message&&<small role="status" className={failed?"auth-message":"rsvp-success"}>{message}</small>}
  </form>;
}
