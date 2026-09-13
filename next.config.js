/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "miro.medium.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/bkash-payment",
        destination: "/pay",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
