/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins:["192.168.100.3","192.168.100.24","192.168.100.*"],
  images:{remotePatterns:[{protocol:"https",hostname:"knkluiwjwvkdqtndyduk.supabase.co",pathname:"/storage/v1/**"}],formats:["image/avif","image/webp"]}
};

export default nextConfig;
