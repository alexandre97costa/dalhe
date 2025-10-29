import { superValidate } from "sveltekit-superforms";
import { laptimeSchema, type LaptimeSchema } from '$lib/schemas/laptimeSchema';

import { zod4 } from "sveltekit-superforms/adapters";

export const load = async () => {
    return {
        laptimeForm: await superValidate(zod4(laptimeSchema)),
    };
};