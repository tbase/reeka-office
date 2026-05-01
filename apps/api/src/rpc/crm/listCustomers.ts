import { ListCustomersQuery } from "@reeka-office/domain-crm";
import { pinyin } from "pinyin-pro";
import { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { customerSortSchema } from "./shared";

export const listCustomers = rpc.define({
  inputSchema: z.object({
    keyword: z.string().optional().nullable(),
    customerTypeId: z.number().int().positive().optional().nullable(),
    sort: customerSortSchema.optional(),
  }).optional(),
  execute: mustAgent(async ({ context, input }) => {
    const customers = await new ListCustomersQuery({
      agentId: context.user.agentId,
      keyword: input?.keyword,
      customerTypeId: input?.customerTypeId,
      sort: input?.sort,
    }).query();

    return customers.map((customer) => ({
      ...customer,
      nameInitial: getNameInitial(customer.name),
    }));
  }),
});

function getNameInitial(name: string): string {
  const normalizedName = name.trim();
  const firstChar = normalizedName.charAt(0);
  if (!firstChar) {
    return "#";
  }

  const upperChar = firstChar.toUpperCase();
  if (upperChar >= "A" && upperChar <= "Z") {
    return upperChar;
  }

  const [initial] = pinyin(normalizedName, {
    pattern: "first",
    toneType: "none",
    type: "array",
    mode: "surname",
    surname: "head",
    traditional: true,
    nonZh: "consecutive",
  });
  const normalizedInitial = initial?.charAt(0).toUpperCase();

  return normalizedInitial && normalizedInitial >= "A" && normalizedInitial <= "Z"
    ? normalizedInitial
    : "#";
}
