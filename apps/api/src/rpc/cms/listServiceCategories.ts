import { rpc } from "../../context";

export const listServiceCategories = rpc.define({
  execute: async () => {
    return [
      { id: 1, name: "Web Development" },
      { id: 2, name: "Mobile Development" },
      { id: 3, name: "UI/UX Design" },
    ];
  },
});
