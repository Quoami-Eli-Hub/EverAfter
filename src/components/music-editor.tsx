"use client";

import {useState,type FormEvent} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
import {saveEventMusic} from "@/app/dashboard/music-actions";

export function MusicEditor({eventId,premium,canEdit,hasMusic}:{eventId:number;premium:boolean;canEdit:boolean;hasMusic:boolean}){
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [saved,setSaved]=useState(hasMusic);
  const router=useRouter();
  async function upload(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const form=event.currentTarget;
    const file=new FormData(form).get("music") as File;
    if(!file?.size||file.size>20*1024*1024||!file.name.toLowerCase().endsWith(".mp3")||!["audio/mpeg","audio/mp3", ""].includes(file.type)){
      setMessage("Choose an MP3 file up to 20 MB.");return;
    }
    setBusy(true);setMessage("Uploading your music…");
    try{
      const supabase=createClient();
      const {error}=await supabase.storage.from("event-music").upload(`${eventId}/track.mp3`,file,{contentType:"audio/mpeg",cacheControl:"0",upsert:true});
      if(error)throw new Error("upload");
      const result=await saveEventMusic(eventId,true);
      setMessage(result.message);
      if(result.ok){setSaved(true);form.reset();router.refresh();}
    }catch{setMessage("Music couldn’t be uploaded. Check your connection and Premium access, then try again.");}
    finally{setBusy(false);}
  }
  async function remove(){
    setBusy(true);
    try{
      const result=await saveEventMusic(eventId,false);
      setMessage(result.message);
      if(result.ok){
        setSaved(false);
        const {error}=await createClient().storage.from("event-music").remove([`${eventId}/track.mp3`]);
        if(error)setMessage("Music is off. The stored file couldn’t be deleted yet; you can replace it with your next upload.");
        router.refresh();
      }
    }catch{setMessage("Music couldn’t be removed. Please try again.");}
    finally{setBusy(false);}
  }
  return <section id="music" className="panel music-editor"><p className="eyebrow">Premium • A personal soundtrack</p><h2>Music for your celebration</h2><p>Add one MP3, up to 20 MB. Guests choose when to listen using the play and pause button. Upload music you have permission to share.</p>
    {!premium?<Link className="button panel-button" href="/dashboard/billing">Upgrade to Premium</Link>:!canEdit?<p>Only the owner or planner can change the music.</p>:<><form onSubmit={upload} className="manage-form"><label>{saved?"Replace music":"Choose music"}<input name="music" type="file" accept=".mp3,audio/mpeg" required disabled={busy}/></label><button className="button button-dark" disabled={busy}>{busy?"Please wait…":saved?"Upload replacement":"Upload music"}</button></form>{saved&&<button className="text-danger" type="button" onClick={remove} disabled={busy}>Remove music</button>}</>}
    <p role="status" aria-live="polite">{message||(saved?"Your event has a soundtrack.":"No music added yet.")}</p>
  </section>;
}
