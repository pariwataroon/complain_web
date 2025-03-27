/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias["@d3"] = "d3";
    }
    return config;
  },
};

// export default nextConfig; //! dev MODE 
export default {
  reactStrictMode: false,
};