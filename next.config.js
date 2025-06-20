const withTM = require("next-transpile-modules")([
  "@mui/material",
  "@mui/system",
  "@mui/icons-material",
  "@mui/x-date-pickers",
]);

const isDev = process.env.NEXT_PUBLIC_ENV_MODE === "development";
const isStaticExport = process.env.BUILD_MODE === "static";

const getEnv = (key) => {
  return process.env[key];
};

const baseConfig = {
  trailingSlash: true,

  images: {
    unoptimized: true,
    loader: "custom",
    loaderFile: "./imageLoader.js",
  },

  reactStrictMode: isDev,

  env: {
    NEXT_PUBLIC_ENV_MODE: process.env.NEXT_PUBLIC_ENV_MODE || "development",
    NEXT_PUBLIC_API_BASE_URL: getEnv("NEXT_PUBLIC_API_BASE_URL") || "",
    NEXT_PUBLIC_DEBUG_MODE:
      getEnv("NEXT_PUBLIC_DEBUG_MODE") === "true" ? "true" : "false",
    NEXT_PUBLIC_COMMON_VAR: process.env.NEXT_PUBLIC_COMMON_VAR || "",
    NEXT_PUBLIC_LOCALE: process.env.NEXT_PUBLIC_LOCALE || "en",
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias["@d3"] = "d3";
    }

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

const staticConfig = {
  ...baseConfig,
  output: "export",
  distDir: "out",
};

const ssrConfig = {
  ...baseConfig,
  distDir: ".next",
};

const nextConfig = isStaticExport ? staticConfig : ssrConfig;


module.exports = withTM(nextConfig);

// module.exports = {
//   eslint: {
//     ignoreDuringBuilds: true,
//   },
// };
