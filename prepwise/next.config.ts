import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure Next.js to handle CommonJS modules as external server packages
  // This prevents webpack from bundling them incorrectly and allows them to be
  // loaded at runtime from node_modules with the correct CommonJS structure
  serverExternalPackages: [
    "pdf-parse",
    "microsoft-cognitiveservices-speech-sdk",
    "pdfkit",
  ],
};

export default nextConfig;
