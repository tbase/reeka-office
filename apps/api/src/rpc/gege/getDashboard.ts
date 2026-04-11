import { GetGegeDashboardQuery } from "@reeka-office/domain-performance";

import { mustAgent, rpc } from "../../context";
import { requireAgentCode } from "./shared";

export type GetDashboardOutput = Awaited<
  ReturnType<GetGegeDashboardQuery["query"]>
>;

export const getDashboard = rpc.define({
  execute: mustAgent(async ({ context }): Promise<GetDashboardOutput> => {
    return new GetGegeDashboardQuery({
      agentCode: requireAgentCode(context),
    }).query();
  }),
});
