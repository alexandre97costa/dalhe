import { z } from "zod/v4";

export const driverSchema = z.object({
    username: z.string().min(0).max(50),
    bio: z.string().min(0).max(100)
});

export type DriverSchema = typeof driverSchema;