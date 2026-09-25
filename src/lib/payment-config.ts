export function paystackMode():"live"|"test"{
  return process.env.PAYSTACK_MODE==="test"?"test":"live";
}
export function paystackReady(){
  const mode=paystackMode();
  return process.env.PAYMENTS_ENABLED==="true"&&Boolean(process.env.SUPABASE_SECRET_KEY)
    &&Boolean(process.env.PAYSTACK_SECRET_KEY?.startsWith(`sk_${mode}_`))
    &&!(process.env.VERCEL_ENV==="production"&&mode==="test");
}
