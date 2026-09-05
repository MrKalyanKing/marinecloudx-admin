import type { NextConfig } from "next";

/**
 * Baseline security headers for the public website. Carried over from the legacy
 * single-app config (see docs/security.md for the rationale and the documented
 * CSP gap). HSTS is production-only.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const hstsHeader = { key: "Strict-Transport-Security", value: "max-age=31536000" };

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  async headers() {
    const headers =
      process.env.NODE_ENV === "production" ? [...securityHeaders, hstsHeader] : securityHeaders;

    return [{ source: "/:path*", headers }];
  },
};

export default nextConfig;
