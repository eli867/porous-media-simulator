import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: {
    '/api/**/*': ['./Perm2D.h', './Perm2D.cpp', './stb_image.h'],
  },
};

export default nextConfig;
