const withTM = require("next-transpile-modules")([
  "@mui/material",
  "@mui/system",
  "@mui/icons-material",
  "@mui/x-date-pickers",
]);

const isDev = process.env.NEXT_PUBLIC_ENV_MODE === "development";

const getEnv = (key) => {
  return process.env[key];
};

const nextConfig = {
  reactStrictMode: isDev,
  env: {
    NEXT_PUBLIC_ENV_MODE: process.env.NEXT_PUBLIC_ENV_MODE,
    NEXT_PUBLIC_API_BASE_URL: getEnv("NEXT_PUBLIC_API_BASE_URL"),
    NEXT_PUBLIC_DEBUG_MODE:
      getEnv("NEXT_PUBLIC_DEBUG_MODE") === "true" ? "true" : "false",
    NEXT_PUBLIC_COMMON_VAR: process.env.NEXT_PUBLIC_COMMON_VAR,
    NEXT_PUBLIC_LOCALE: process.env.NEXT_PUBLIC_LOCALE,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias["@d3"] = "d3";
    }
    return config;
  },
};

module.exports = withTM(nextConfig);
