import {safeEqual,verifyAndActivateFlutterwave} from "@/lib/payments";
export async function POST(request:Request){
  const secret=process.env.FLUTTERWAVE_WEBHOOK_SECRET,signature=request.headers.get("verif-hash");
  if(!secret||!signature||!safeEqual(secret,signature))return new Response("Unauthorized",{status:401});
  let payload:{event?:string;data?:{id?:string|number;tx_ref?:string;status?:string}};
  try{payload=await request.json()}catch{return new Response("Bad request",{status:400})}
  if(payload.event==="charge.completed"&&payload.data?.status==="successful"){
    if(!payload.data.id||!payload.data.tx_ref)return new Response("Bad request",{status:400});
    if(!await verifyAndActivateFlutterwave(String(payload.data.id),payload.data.tx_ref))return new Response("Verification unavailable",{status:503});
  }
  return Response.json({received:true});
}
