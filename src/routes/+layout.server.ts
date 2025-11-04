import type { LayoutServerLoad } from './$types';
import { superValidate } from "sveltekit-superforms";
import { laptimeSchema } from '$lib/schemas/laptimeSchema';
import { zod4 } from "sveltekit-superforms/adapters";
import { supabase } from '$lib/supabaseClient';
import type { QueryResult, QueryData, QueryError } from '@supabase/supabase-js'

// export type CarMake = {
//     id: number;
//     name: string;
// };

// export type CarModel = {
//     id: number;
//     name: string;
//     make_id: number;
//     year: number;
//     category: string;
// }

export const load: LayoutServerLoad = async () => {

    const carMakesQuery = supabase
        .from('car_make')
        .select();
    type CarMakes = QueryData<typeof carMakesQuery> | null;
    const { data: carMakeData, error: carMakeError } = await carMakesQuery;
    const carMakes: CarMakes = carMakeData;
    
    const carModelsQuery = supabase
    .from('car')
    .select(`id, name:model, make_id, year, category:category_id(name)`);
    type CarModels = QueryData<typeof carModelsQuery> | null;
    const { data: carModelData, error: carModelError } = await carModelsQuery;
    const carModels: CarModels = carModelData;

    const error = carMakeError || carModelError;
    if (error) {
        console.error('Error fetching car makes or models:', error.message);
        return {
            laptimeForm: await superValidate(zod4(laptimeSchema)),
            car_makes: [],
            car_models: [],
        };
    }

    return {
        laptimeForm: await superValidate(zod4(laptimeSchema)),
        car_makes: carMakes ?? [],
        car_models: carModels ?? [],
    };
};

