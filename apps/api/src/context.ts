import { User } from "@reeka-office/domain-user";
import { createRpc } from "@reeka-office/jsonrpc";

export type APIContext = {
  openid: string;
  envid: string;
  user: User | null;
};

export const rpc = createRpc<APIContext>();

