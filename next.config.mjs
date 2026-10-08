/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["mongodb", "nodemailer", "mongodb-memory-server"],
};
export default nextConfig;
