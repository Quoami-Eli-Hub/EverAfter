export function safeNextPath(value:string|null){
  if(!value||!value.startsWith("/")||value.startsWith("//")||/[\\\u0000-\u001f]/.test(value))return "/dashboard";
  try{const url=new URL(value,"https://everafter.invalid");return url.origin==="https://everafter.invalid"?url.pathname+url.search+url.hash:"/dashboard";}catch{return "/dashboard";}
}
