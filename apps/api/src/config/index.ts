export const config = {
  server: {
    port: Number(process.env.PORT) || 3000,
    hostname: process.env.HOSTNAME || "0.0.0.0",
  },
  externalApi: {
    agentInfoUrl: process.env.AGENT_INFO_URL || "https://pru.new-moon.vip/api/agent/info",
  },
} as const;
