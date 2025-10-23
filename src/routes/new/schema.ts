import { z } from "zod/v4";

export const formSchema = z.object({
    laptime: z.iso.time({ precision: 3 }),
    username: z.string().min(2).max(50),
});

export type FormSchema = typeof formSchema;