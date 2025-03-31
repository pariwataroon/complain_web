/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === "development";

const getEnv = (key) => {
  const prefix = isDev ? "DEV_" : "PROD_";
  return process.env[`${prefix}${key}`] || process.env[key];
};

const nextConfig = {
  reactStrictMode: !isDev,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_ENV: isDev ? "development" : "production",
    NEXT_PUBLIC_API_BASE_URL: getEnv("NEXT_PUBLIC_API_BASE_URL"),
    NEXT_PUBLIC_DEBUG_MODE: getEnv("NEXT_PUBLIC_DEBUG_MODE") === "true",
    NEXT_PUBLIC_COMMON_VAR: process.env.NEXT_PUBLIC_COMMON_VAR,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias["@d3"] = "d3";
    }
    return config;
  },
};

module.exports = nextConfig;
