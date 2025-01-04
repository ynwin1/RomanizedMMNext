import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "i.scdn.co",
            },
        ],
    },
    async redirects() {
        return [
            {
                source: '/song/:songName',
                destination: '/',
                permanent: false
            },
            {
                source: '/:path*',
                has: [
                    {
                        type: 'host',
                        value: 'romanizedmm.com',
                    },
                ],
                destination: 'https://www.romanizedmm.com/:path*', // Redirect to www
                permanent: true,
            }
        ]
    },
};

export default withNextIntl(nextConfig);
