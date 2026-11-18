import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: '4.5mb' } },
  images: { remotePatterns: process.env.NEXT_PUBLIC_SUPABASE_URL ? [{
    protocol: 'https', hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
    pathname: '/storage/v1/object/public/beauty-site/site/**', search: '',
  }] : [] },
  async headers() {
    return ['/auth/:path*', '/nova-senha', '/recuperar-senha', '/sucesso/:path*', '/painel/:path*', '/login', '/agendar'].map(source => ({
      source,
      headers: [
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'Cache-Control', value: 'private, no-store' },
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
      ],
    }));
  },
};

export default nextConfig;
