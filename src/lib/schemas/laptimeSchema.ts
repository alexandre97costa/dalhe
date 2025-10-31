import { z } from "zod/v4";

export const laptimeSchema = z.object({
    username: z.string().min(0).max(50),
    laptime: z.stringFormat("laptime", /^[0-5]{1}[0-9]{1}[0-5]{1}[0-9]{4}$/),
    car_make: z.string()
});

export type LaptimeSchema = typeof laptimeSchema;