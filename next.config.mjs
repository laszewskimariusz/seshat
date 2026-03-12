/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['node-cron', 'better-sqlite3', '@prisma/adapter-better-sqlite3'],
}

export default nextConfig
