/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // postgres.js and pino are node libraries that should not be bundled into the
  // server build; keep them external so their runtime require graph stays intact.
  serverExternalPackages: ["postgres", "pino"],
  webpack: (config) => {
    // the indexer under src/ is authored in NodeNext style with explicit .js
    // specifiers that point at .ts files. teach webpack to resolve a .js import
    // to the .ts source first, so the web app can reuse src/resolve.ts et al.
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };
    return config;
  },
};

export default nextConfig;
