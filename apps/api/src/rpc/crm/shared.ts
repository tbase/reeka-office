import { z } from "zod";

export const customerSortSchema = z.enum(["last_followed_desc", "created_desc"]);
export const customerGenderSchema = z.enum(["M", "F"]);

export const profileValueInputSchema = z.object({
  fieldId: z.number().int().positive(),
  value: z.string().optional().nullable(),
});

export const customerPayloadSchema = z.object({
  customerTypeId: z.number().int().positive(),
  name: z.string(),
  gender: customerGenderSchema.optional().nullable(),
  phone: z.string().optional().nullable(),
  wechat: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  note: z.string().optional().nullable(),
  profileValues: z.array(profileValueInputSchema).optional(),
  allowDuplicate: z.boolean().optional(),
});

export const customerIdInputSchema = z.object({
  customerId: z.number().int().positive(),
});
