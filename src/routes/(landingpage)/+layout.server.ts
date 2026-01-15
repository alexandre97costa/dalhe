import type { LayoutServerLoad } from './$types';
import { superValidate } from "sveltekit-superforms";
import { laptimeSchema } from '$lib/schemas/laptimeSchema';
import { zod4 } from "sveltekit-superforms/adapters";
import { supabase } from '$lib/supabaseClient';
import type { FormDataRecord, FormQuery } from '../../app';
import type { QueryResult, QueryData, QueryError } from '@supabase/supabase-js'
import { form } from '$app/server';

const formQueries: FormQuery[] = [
    { key: 'carMakes', from: 'car_make', select: 'id, name, logo' },
    { key: 'cars', from: 'car', select: 'id, name:model, make_id, year, category:category_id(name)' },
    { key: 'raceTracks', from: 'race_track', select: 'id, name' },
]

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, cookies }) => {

    const { session, user } = await safeGetSession()

    const promises = formQueries.map(q => supabase.from(q.from).select(q.select ?? '*'));
    const results = await Promise.allSettled(promises);
    const formDataRecord: FormDataRecord = {};

    formQueries.forEach((query, index) => {
        const result = results[index];
        formDataRecord[query.key] = result.status === 'fulfilled' ? result.value.data : null;
    });

    return {
        laptimeForm: await superValidate(zod4(laptimeSchema)),
        formDataRecord,
        session,
        user,
        cookies: cookies.getAll(),
    };
};

