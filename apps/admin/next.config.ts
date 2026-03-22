import path from "node:path"

import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@reeka-office/domain-agent',
    '@reeka-office/domain-cms',
    '@reeka-office/domain-identity',
    '@reeka-office/domain-plan',
    '@reeka-office/domain-point',
    '@reeka-office/jsonrpc',
  ],
  outputFileTracingRoot: path.join(__dirname, '../..'),
}

export default nextConfig
