import type { NextConfig } from "next";

// Deliberately no cacheComponents — /api/analyze is a plain route handler
// with no server-side caching (every submission is different input by
// definition), not a Server-Component data-fetching flow.
const nextConfig: NextConfig = {};

export default nextConfig;
