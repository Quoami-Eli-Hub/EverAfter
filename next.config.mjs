/** @type {import('next').NextConfig} */
const nextConfig = {
  headers(){return [{source:"/:path*",headers:[
    {key:"X-Content-Type-Options",value:"nosniff"},
    {key:"X-Frame-Options",value:"SAMEORIGIN"},
    {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
    {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"}
  ]}]},
  allowedDevOrigins:["192.168.100.3","192.168.100.24","192.168.100.*"],
  images:{remotePatterns:[{protocol:"https",hostname:"knkluiwjwvkdqtndyduk.supabase.co",pathname:"/storage/v1/**"}],formats:["image/avif","image/webp"]}
};

export default nextConfig;
