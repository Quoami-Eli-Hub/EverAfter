import {NextResponse} from "next/server";
import {verifyAndActivateFlutterwave} from "@/lib/payments";
export async function GET(request:Request){const url=new URL(request.url),id=url.searchParams.get("transaction_id"),reference=url.searchParams.get("tx_ref"),status=url.searchParams.get("status");const success=status==="successful"&&id&&reference?await verifyAndActivateFlutterwave(id,reference):false;return NextResponse.redirect(new URL(`/dashboard/billing?payment=${success?"success":"failed"}`,url.origin))}
