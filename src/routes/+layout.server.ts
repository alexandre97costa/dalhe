import type { LayoutServerLoad } from './$types';
import { superValidate } from "sveltekit-superforms";
import { laptimeSchema } from '$lib/schemas/laptimeSchema';

import { zod4 } from "sveltekit-superforms/adapters";

export const load: LayoutServerLoad = async () => {
    return {
        laptimeForm: await superValidate(zod4(laptimeSchema)),
    };
};

