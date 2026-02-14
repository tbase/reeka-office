import { defineFunc } from "@reeka-office/jsonrpc";

export const listServiceCategories = defineFunc({
  execute: async () => {
    return [
      { id: 1, name: "Web Development" },
      { id: 2, name: "Mobile Development" },
      { id: 3, name: "UI/UX Design" },
    ];
  },
});
