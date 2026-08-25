import {NextResponse} from "next/server";
import {verifyAndActivatePaystack} from "@/lib/payments";
export async function GET(request:Request){const url=new URL(request.url),reference=url.searchParams.get("reference")??url.searchParams.get("trxref");const success=reference?await verifyAndActivatePaystack(reference):false;return NextResponse.redirect(new URL(`/dashboard/billing?payment=${success?"success":"failed"}`,url.origin))}
