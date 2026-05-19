import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Permite servir imágenes locales (seed + uploads) y SVGs
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [],
    unoptimized: process.env.NODE_ENV === 'development',
  },
}

export default nextConfig
