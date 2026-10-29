import type { TypedSupabaseClient } from '$lib/types/supabase';

export async function getRigById(supabaseClient: TypedSupabaseClient, rigId: string) {
	const { data, error } = await supabaseClient
		.from('rig')
		.select(
			`
            id,
            name,
            rig_session (
                profiles (
                    id,
                    username
                )
            )
        `
		)
		.eq('id', rigId)
		.is('rig_session.ended_at', null)
		.single();

	if (error && error?.code !== 'PGRST116') throw error;
	if (!data) return null;

	return {
		id: data.id,
		name: data.name,
		driver_id: data.rig_session?.[0]?.profiles?.id ?? null,
		driver_name: data.rig_session?.[0]?.profiles?.username ?? null
	};
}
