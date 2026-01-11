import type { LayoutServerLoad } from './$types';
import { superValidate } from "sveltekit-superforms";
import { laptimeSchema } from '$lib/schemas/laptimeSchema';
import { zod4 } from "sveltekit-superforms/adapters";
import { supabase } from '$lib/supabaseClient';
import type { QueryResult, QueryData, QueryError } from '@supabase/supabase-js'
import { form } from '$app/server';
import type { Form } from '@lucide/svelte';

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

interface formQuery {
    from: string,
    select: string | null,
}

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, cookies }) => {

    const { session, user } = await safeGetSession()

    const formQueries: formQuery[] = [
        { from: 'car_make', select: null },
        { from: 'car', select: `id, name:model, make_id, year, category:category_id(name)` },
        { from: 'race_track', select: `id, name` },
    ]

    let formData: QueryData<any>[] = [];

    formQueries.forEach(async (query) => {
        const formQuery = supabase
            .from(query.from)
            .select(query.select ?? '*');
        type FormData = QueryData<typeof formQuery>; 

        const { data, error } = await formQuery;
        if (error) throw error;
        formData.push(data as FormData);
    });


    return {
        laptimeForm: await superValidate(zod4(laptimeSchema)),
        formData,
        session,
        user,
        cookies: cookies.getAll(),
    };
};

