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
                        value: 'www.romanizedmm.com',
                    },
                ],
                destination: 'https://romanizedmm.com/:path*',
                permanent: true,
            }
        ]
    },
};

export default withNextIntl(nextConfig);
