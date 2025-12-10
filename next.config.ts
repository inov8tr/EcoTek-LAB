import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    PY_SERVICE_URL: process.env.PY_SERVICE_URL,
    PY_SERVICE_PORT: process.env.PY_SERVICE_PORT,
    NEXT_PUBLIC_PY_SERVICE_URL: process.env.NEXT_PUBLIC_PY_SERVICE_URL,
    PY_SERVICE_TOKEN: process.env.PY_SERVICE_TOKEN,
  },
};

export default nextConfig;
