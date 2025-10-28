import { z } from "zod/v4";

export const laptimeSchema = z.object({
    laptime: z.iso.time({ precision: 3 }),
    username: z.string().min(2).max(50),
});

export type LaptimeSchema = typeof laptimeSchema;