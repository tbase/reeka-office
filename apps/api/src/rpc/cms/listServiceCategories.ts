import { z } from "zod";

import { mustAgent, rpc } from "../../context";

const inputSchema = z.void();

export const listServiceCategories = rpc.define({
  inputSchema,
  execute: mustAgent(async () => {
    return [
      { id: 1, name: "Web Development" },
      { id: 2, name: "Mobile Development" },
      { id: 3, name: "UI/UX Design" },
    ];
  }),
});
