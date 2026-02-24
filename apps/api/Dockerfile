FROM oven/bun:1 AS base
WORKDIR /app

# Install ca-certificates for 微信云托管开放接口服务 HTTPS 支持
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Install dependencies
FROM base AS deps
COPY package.json ./
RUN bun install --frozen-lockfile --production

# Production image
FROM base AS runner
ENV NODE_ENV=production

# 微信云托管开放接口服务证书配置 (Bun/Node.js 运行时)
ENV NODE_EXTRA_CA_CERTS=/app/cert/certificate.crt

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000
CMD ["bun", "run", "index.ts"]
