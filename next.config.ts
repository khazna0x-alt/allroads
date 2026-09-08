import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.convex.cloud",
      },
      {
        protocol: "https",
        hostname: "*.eu-west-1.convex.cloud",
      },
    ],
  },
  async headers() {
    const contentSecurityPolicy = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.youraiconnector.com https://app.waagents.ai",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.convex.cloud https://*.eu-west-1.convex.cloud https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.googleusercontent.com https://api.youraiconnector.com https://app.waagents.ai",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.eu-west-1.convex.cloud wss://*.eu-west-1.convex.cloud https://*.convex.site https://api.youraiconnector.com wss://api.youraiconnector.com https://*.youraiconnector.com wss://*.youraiconnector.com https://app.waagents.ai wss://app.waagents.ai https://*.waagents.ai",
      "frame-src https://www.google.com https://maps.google.com https://www.google.com/maps https://api.youraiconnector.com https://app.waagents.ai",
      "media-src 'self' data: blob: https://api.youraiconnector.com",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
