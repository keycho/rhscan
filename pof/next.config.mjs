/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pof/ is a self-contained app inside the rhscan repo; pin the tracing root
  // so next doesn't infer the repo root from the outer pnpm lockfile.
  outputFileTracingRoot: import.meta.dirname,
};

export default nextConfig;
