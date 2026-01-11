import type { LayoutServerLoad } from './$types';
import { superValidate } from "sveltekit-superforms";
import { laptimeSchema } from '$lib/schemas/laptimeSchema';
import { zod4 } from "sveltekit-superforms/adapters";
import { supabase } from '$lib/supabaseClient';
import type { QueryResult, QueryData, QueryError } from '@supabase/supabase-js'
import { form } from '$app/server';

interface FormQuery {
    key: string,
    from: string,
    select: string | null,
}

type FormDataRecord = Record<string, QueryData<any> | null>;

const formQueries: FormQuery[] = [
    { key: 'carMakes', from: 'car_make', select: 'id, name, logo' },
    { key: 'cars', from: 'car', select: 'id, name:model, make_id, year, category:category_id(name)' },
    { key: 'raceTracks', from: 'race_track', select: 'id, name' },
]

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, cookies }) => {

    const { session, user } = await safeGetSession()

    const promises = formQueries.map(q => supabase.from(q.from).select(q.select ?? '*'));
    const results = await Promise.allSettled(promises);
    const formData: FormDataRecord = {};

    formQueries.forEach((query, index) => {
        const result = results[index];
        formData[query.key] = result.status === 'fulfilled' ? result.value.data : null;
    });

    return {
        laptimeForm: await superValidate(zod4(laptimeSchema)),
        formData,
        session,
        user,
        cookies: cookies.getAll(),
    };
};

