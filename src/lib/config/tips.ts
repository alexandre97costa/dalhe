// Dismissible tips (Sprint 2, D3). One key per tip; dismissals are stored per user in
// public.user_tip, so they follow the user across devices. Keys: lower case, digits, _.
export const TIP_KEYS = ['rig_saved'] as const;

export type TipKey = (typeof TIP_KEYS)[number];

export function isTipKey(value: unknown): value is TipKey {
	return typeof value === 'string' && (TIP_KEYS as readonly string[]).includes(value);
}
