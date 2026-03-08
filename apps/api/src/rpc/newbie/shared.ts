import { z } from "zod";

export const newbieCheckinOutputSchema = z.object({
  taskId: z.number().int().positive(),
  checkedInAt: z.string(),
  evidenceFileIds: z.array(z.string()),
});
