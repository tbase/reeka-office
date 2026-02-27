import { z } from "zod";

export type RequestContext = {
  openid: string;
  envid: string;
  user: {
    agentCode: string;
  };
};

export const AGENT_CODE_REGEX = /^[A-Za-z0-9]{8}$/;
const AGENT_ID_REGEX = /^\d+$/;

export const agentCodeSchema = z.string().regex(AGENT_CODE_REGEX);
export const redeemItemIdSchema = z.string().regex(AGENT_ID_REGEX);

export const agentInputSchema = z.object({
  agentCode: agentCodeSchema.optional(),
});

export const redeemItemInputSchema = z.object({
  itemId: redeemItemIdSchema,
  agentCode: agentCodeSchema.optional(),
});

export const redeemDetailInputSchema = redeemItemInputSchema;

export const redeemSubmitInputSchema = redeemItemInputSchema;

export const formatDateTime = (value: Date | string): string => {
  const date = value instanceof Date ? value : new Date(value);

  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}`;
};

export const parseNotes = (notice: string | null): string[] => {
  if (!notice) return ["请在兑换后尽快使用权益", "如有疑问请联系管理员"];

  const lines = notice
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.length > 0 ? lines : [notice];
};
