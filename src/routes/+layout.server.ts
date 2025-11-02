import type { LayoutServerLoad } from './$types';
import { superValidate } from "sveltekit-superforms";
import { laptimeSchema } from '$lib/schemas/laptimeSchema';
import { zod4 } from "sveltekit-superforms/adapters";
import { supabase } from '$lib/supabaseClient';

type CarMake = {
	id: number;
	name: string;
};

export const load: LayoutServerLoad = async () => {
    const { data, error } = await supabase.from('car_make').select<'car_make', CarMake>();

    if (error) {
		console.error('Error loading car makes:', error.message);
		return { 
            laptimeForm: await superValidate(zod4(laptimeSchema)),
            car_make: [] 
        };
	}
    
    return {
        laptimeForm: await superValidate(zod4(laptimeSchema)),
        car_make: data ?? [],
    };
};

