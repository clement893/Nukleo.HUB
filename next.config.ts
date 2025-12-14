import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  output: "standalone",
  
  // Activer la compression
  compress: true,
  
  // Optimisation des images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "v5.airtableusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.airtableusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.google.com",
        pathname: "/s2/favicons/**",
      },
      {
        protocol: "https",
        hostname: "icons.duckduckgo.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "nukleo-hub-photos.s3.us-east-2.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
    // Formats d'images optimisés
    formats: ["image/avif", "image/webp"],
    // Tailles d'images prédéfinies pour optimisation
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimiser le temps de génération
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 jours
  },
  
  // Headers de sécurité et de cache HTTP
  async headers() {
    return [
      // Headers de sécurité pour toutes les pages
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com; frame-src 'self' https://accounts.google.com; object-src 'none'; base-uri 'self'; form-action 'self';",
          },
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          }
        ],
      },
      // Cache long pour les assets statiques (JS, CSS)
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache pour les images optimisées
      {
        source: "/_next/image(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      // Cache pour les fichiers statiques publics
      {
        source: "/(.*)\\.(ico|png|jpg|jpeg|gif|svg|webp|avif|woff|woff2|ttf|eot)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
      // Cache court pour les APIs (avec revalidation)
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
  
  // Optimisations expérimentales
  experimental: {
    // Optimiser le chargement des packages
    optimizePackageImports: ["lucide-react", "@prisma/client"],
    // Optimiser les requêtes de base de données
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // Optimiser les imports de React
    optimizeCss: true,
  },
  
  // Optimisations de production
  productionBrowserSourceMaps: false,
  
  // Optimiser les imports
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{kebabCase member}}",
    },
  },
};

export default nextConfig;
