import {DashboardNav} from "@/components/dashboard-nav";
import Image from "next/image";
import {MediaUploader} from "@/components/media-uploader";
import {DocumentUploader} from "@/components/document-uploader";
import {getOwnerEvent} from "@/lib/event-owner";
import {createAlbum,deleteRecord} from "../actions";

export default async function Gallery(){
  const{supabase,event,user}=await getOwnerEvent();
  const[{data:albums},{data:media},{data:documents}]=await Promise.all([
    supabase.from("albums").select("*").eq("event_id",event.id).order("sort_order"),
    supabase.from("media").select("*").eq("event_id",event.id).order("sort_order"),
    supabase.from("documents").select("*").eq("event_id",event.id).order("created_at",{ascending:false})
  ]);
  const signed=await Promise.all((media??[]).map(async item=>({...item,url:(await supabase.storage.from("event-media").createSignedUrl(item.storage_path,3600)).data?.signedUrl??""})));
  return <div className="app-shell"><DashboardNav active="Gallery"/><main className="app-main">
    <div className="page-heading"><div><p className="eyebrow">Albums & uploads</p><h1>Your event gallery</h1><p>{(event.storage_used_bytes/1048576).toFixed(1)} MB of {(event.storage_limit_bytes/1073741824).toFixed(0)} GB used</p></div></div>
    <div className="grid-2 manage-grid"><section className="panel"><h2>Create album</h2><form action={createAlbum} className="manage-form"><input name="title" required maxLength={80} placeholder="Ceremony, reception, family..."/><textarea name="description" maxLength={300} placeholder="Album description"/><label><input type="checkbox" name="allowDownloads"/> Allow album downloads</label><button className="button button-dark">Create album</button></form>{albums?.map(a=><article className="manage-row" key={a.id}><div><b>{a.title}</b><small>{a.allow_downloads?"Downloads allowed":"Viewing only"}</small></div><form action={deleteRecord}><input type="hidden" name="table" value="albums"/><input type="hidden" name="id" value={a.id}/><button>Remove</button></form></article>)}</section>
      <section className="panel"><h2>Upload photo</h2><MediaUploader eventId={event.id} userId={user.id} albums={albums??[]}/><p className="security-note">JPEG, PNG or WebP · maximum 25 MB · owner-only upload path</p></section></div>
    <div className="media-grid">{signed.map(m=><article className="panel" key={m.id}>{m.url?<Image className="media-preview" src={m.url} alt={m.caption??m.original_name} width={800} height={600} sizes="(max-width: 850px) 50vw, 25vw"/>:<div className="media-placeholder">IMAGE</div>}<b>{m.caption||m.original_name}</b><small>{(m.byte_size/1048576).toFixed(1)} MB · {m.allow_download?"Downloadable":"View only"}</small><form action={deleteRecord}><input type="hidden" name="table" value="media"/><input type="hidden" name="id" value={m.id}/><button>Delete</button></form></article>)}</div>
    {event.event_type==="memorial"&&<section className="panel documents-panel"><h2>Programmes and posters</h2><DocumentUploader eventId={event.id} userId={user.id}/>{documents?.map(doc=><article className="manage-row" key={doc.id}><div><b>{doc.title}</b><small>{doc.document_type} · {(doc.byte_size/1048576).toFixed(1)} MB</small></div><form action={deleteRecord}><input type="hidden" name="table" value="documents"/><input type="hidden" name="id" value={doc.id}/><button>Delete</button></form></article>)}</section>}
  </main></div>;
}
