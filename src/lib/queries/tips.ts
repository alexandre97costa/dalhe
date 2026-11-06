// queries for dismissible tips (public.user_tip, RLS: the user's own rows only)

import type { TypedSupabaseClient } from '$lib/types/supabase';
import { isTipKey, type TipKey } from '$lib/config/tips';

// The tips this user has dismissed.
export async function getDismissedTips(
	supabaseClient: TypedSupabaseClient,
	userId: string
): Promise<TipKey[]> {
	const { data, error } = await supabaseClient
		.from('user_tip')
		.select('tip_key')
		.eq('user_id', userId);
	if (error) throw error;

	return data.map((row) => row.tip_key).filter(isTipKey);
}

// Dismisses a tip for this user. Dismissing it again is a no-op.
export async function dismissTip(
	supabaseClient: TypedSupabaseClient,
	userId: string,
	tipKey: TipKey
): Promise<void> {
	const { error } = await supabaseClient
		.from('user_tip')
		.upsert({ user_id: userId, tip_key: tipKey }, { ignoreDuplicates: true });
	if (error) throw error;
}
