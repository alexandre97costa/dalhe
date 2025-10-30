import { z } from "zod/v4";

export const laptimeSchema = z.object({
    laptime: z.stringFormat("laptime", /^[0-5]{1}[0-9]{1}[0-5]{1}[0-9]{4}$/),
    username: z.string().min(0).max(50),
});

export type LaptimeSchema = typeof laptimeSchema;