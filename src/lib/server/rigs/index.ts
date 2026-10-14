import { supabase } from '$lib/supabaseClient';

export async function resolveRig(
    supabaseClient: typeof supabase,
    rigId: string) {


    const { data, error } = await supabaseClient
        .from('rig')
        .select(`
            id,
            name,
            rig_session (
                id, 
                profiles (
                    id,
                    username
                )    
            )
        `)
        .eq('id', rigId)
        .is('rig_session.ended_at', null)
        .single();
    

    // const { error } = await supabaseClient
    //     .from('rig_stats')
    //     .update({
    //         session_stats: stats,
    //         session_updated_at: new Date().toISOString()
    //     })
    //     .eq('id', rigId);
    // if (error) throw error;

}