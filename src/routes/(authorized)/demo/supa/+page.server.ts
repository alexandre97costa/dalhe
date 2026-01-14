import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';

type CarMake = {
	id: number;
	name: string;
};

export const load: PageServerLoad = async () => {
	const { data, error } = await supabase.from('car_make').select<'car_make', CarMake>();

	if (error) {
		console.error('Error loading car makes:', error.message);
		return { car_make: [] };
	}

	return {
		car_make: data ?? [],
	};
};