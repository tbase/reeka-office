export const config = {
  server: {
    port: Number(process.env.PORT) || 3000,
    hostname: process.env.HOSTNAME || "0.0.0.0",
  },
} as const;
