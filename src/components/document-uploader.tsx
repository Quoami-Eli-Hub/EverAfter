"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";

export function DocumentUploader({eventId,userId}:{eventId:number;userId:string}) {
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const router=useRouter();

  async function upload(formData:FormData) {
    const file=formData.get("file") as File;
    const title=String(formData.get("title")??"").trim();
    if(!file?.size||!title)return;
    if(file.type!=="application/pdf"||file.size>25*1024*1024){setMessage("Upload a PDF of 25 MB or less.");return}
    setBusy(true);setMessage("");
    const supabase=createClient();
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"-");
    const path=`${userId}/${eventId}/documents/${crypto.randomUUID()}-${safe}`;
    const {error:uploadError}=await supabase.storage.from("event-media").upload(path,file,{contentType:file.type,upsert:false});
    if(uploadError){setMessage("We couldn’t upload this document. Check your connection and try again.");setBusy(false);return}
    const {error}=await supabase.from("documents").insert({event_id:eventId,storage_path:path,document_type:String(formData.get("documentType")??"funeral_program"),title,mime_type:file.type,byte_size:file.size,allow_download:formData.get("allowDownload")==="on"});
    if(error){await supabase.storage.from("event-media").remove([path]);setMessage("The document uploaded, but could not be added to the event. Please try again.")}else{setMessage("Your document has been uploaded and added to the event.");router.refresh()}
    setBusy(false);
  }

  return <form action={upload} className="manage-form upload-form">
    <input name="title" required placeholder="Document title"/>
    <select name="documentType"><option value="funeral_program">Funeral programme</option><option value="poster">Poster</option><option value="other">Other PDF</option></select>
    <input name="file" type="file" accept="application/pdf" required/>
    <label><input type="checkbox" name="allowDownload" defaultChecked/> Allow visitors to download</label>
    <button className="button button-dark" disabled={busy}>{busy?"Uploading...":"Upload PDF"}</button>
    {message&&<small>{message}</small>}
  </form>;
}
