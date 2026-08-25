"use client";

import {FormEvent, useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";

type Album={id:number;title:string};
type UploadState="idle"|"uploading"|"saving"|"success"|"error";

function fileSize(bytes:number){return bytes<1048576?`${(bytes/1024).toFixed(0)} KB`:`${(bytes/1048576).toFixed(1)} MB`}

export function MediaUploader({eventId,userId,albums}:{eventId:number;userId:string;albums:Album[]}){
  const[state,setState]=useState<UploadState>("idle");
  const[message,setMessage]=useState("Choose a photo to begin.");
  const[selected,setSelected]=useState<File|null>(null);
  const router=useRouter();
  const busy=state==="uploading"||state==="saving";
  const progress=state==="uploading"?55:state==="saving"?88:state==="success"?100:0;

  async function upload(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const form=event.currentTarget;
    const formData=new FormData(form);
    const file=formData.get("file") as File;
    const albumId=Number(formData.get("albumId"))||null;

    if(!file||file.size===0){setState("error");setMessage("Choose a photo before uploading.");return}
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)){
      setState("error");setMessage("This file type is not supported. Choose a JPEG, PNG or WebP photo.");return;
    }
    if(file.size>25*1024*1024){setState("error");setMessage("This photo is larger than the 25 MB upload limit.");return}

    const supabase=createClient();
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"-");
    const path=`${userId}/${eventId}/${crypto.randomUUID()}-${safe}`;

    try{
      setState("uploading");
      setMessage(`Uploading ${file.name}… Keep this page open.`);
      const{error:uploadError}=await supabase.storage.from("event-media").upload(path,file,{contentType:file.type,cacheControl:"3600",upsert:false});
      if(uploadError)throw new Error(uploadError.message);

      setState("saving");
      setMessage("Photo uploaded. Adding it to your gallery…");
      const{error:recordError}=await supabase.from("media").insert({event_id:eventId,album_id:albumId,storage_path:path,media_type:"image",mime_type:file.type,original_name:file.name,byte_size:file.size,caption:String(formData.get("caption")??"").trim()||null,allow_download:formData.get("allowDownload")==="on"});
      if(recordError){
        await supabase.storage.from("event-media").remove([path]);
        throw new Error(recordError.message);
      }

      setState("success");
      setMessage(`${file.name} was uploaded successfully and is now in your gallery.`);
      setSelected(null);
      form.reset();
      router.refresh();
    }catch(error){
      setState("error");
      setMessage(error instanceof Error?`Upload failed: ${error.message}`:"Upload failed. Check your connection and try again.");
    }
  }

  return <form onSubmit={upload} className="manage-form upload-form">
    <label className="upload-picker">Choose photo
      <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required disabled={busy} onChange={event=>{
        const file=event.target.files?.[0]??null;
        setSelected(file);
        setState("idle");
        setMessage(file?`${file.name} selected · ${fileSize(file.size)}`:"Choose a photo to begin.");
      }}/>
    </label>
    {selected&&<div className="upload-selection"><b>{selected.name}</b><span>{fileSize(selected.size)}</span></div>}
    <input name="caption" placeholder="Photo caption (optional)" disabled={busy}/>
    <select name="albumId" disabled={busy}><option value="">No album</option>{albums.map(a=><option key={a.id} value={a.id}>{a.title}</option>)}</select>
    <label><input type="checkbox" name="allowDownload" disabled={busy}/> Allow this photo to be downloaded</label>
    <button className="button button-dark" disabled={busy||!selected}>{state==="uploading"?"Uploading photo…":state==="saving"?"Finishing upload…":"Upload photo"}</button>
    {busy&&<progress className="upload-progress" max="100" value={progress} aria-label="Upload progress"/>}
    <div className={`upload-status upload-status-${state}`} role="status" aria-live="polite">{message}</div>
  </form>;
}
