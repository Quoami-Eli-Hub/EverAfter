import {ImageResponse} from "next/og";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {getEventShare} from "@/lib/event-share";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(_request:Request,{params}:{params:Promise<{slug:string}>}){
  const{slug}=await params;
  const invitation=await getEventShare(slug);
  if(!invitation)return new Response("Invitation not found",{status:404});
  let photo:string|null=null;
  try{
    if(invitation.photo){
      const response=await fetch(invitation.photo,{signal:AbortSignal.timeout(5000)});
      const type=response.headers.get("content-type")?.split(";")[0];
      if(response.ok&&type&&["image/jpeg","image/png","image/webp"].includes(type)){
        const bytes=await response.arrayBuffer();
        if(bytes.byteLength<=8*1024*1024)photo=`data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
      }
    }else if(invitation.localPhoto){
      photo=`data:image/png;base64,${(await readFile(path.join(process.cwd(),"public",invitation.localPhoto))).toString("base64")}`;
    }
  }catch{/* The invitation card remains available if its photograph cannot load. */}
  return new ImageResponse(
    <div style={{width:"100%",height:"100%",display:"flex",background:"#f7f1e7",color:"#392f2b",padding:32}}>
      <div style={{display:"flex",width:"100%",height:"100%",border:"2px solid #b99a64"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",width:photo?"58%":"100%",padding:40,textAlign:"center"}}>
          <div style={{fontSize:19,letterSpacing:5,marginBottom:30}}>YOU ARE INVITED</div>
          <div style={{fontSize:invitation.title.length>55?44:62,lineHeight:1.12,marginBottom:30}}>{invitation.title.slice(0,120)}</div>
          <div style={{fontSize:24,marginBottom:38}}>{invitation.date}</div>
          <div style={{fontSize:21,color:"#715331"}}>Open your invitation →</div>
          <div style={{fontSize:18,marginTop:32}}>EverAfter</div>
        </div>
        {/* ImageResponse renders a PNG; next/image cannot be used inside it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {photo&&<img src={photo} alt="" width={477} height={562} style={{width:"42%",height:"100%",objectFit:"cover",objectPosition:invitation.localPhoto&&!invitation.photo?"80% center":"center"}}/>}
      </div>
    </div>,
    {width:1200,height:630,headers:{"Cache-Control":"public, max-age=300, s-maxage=300"}}
  );
}
