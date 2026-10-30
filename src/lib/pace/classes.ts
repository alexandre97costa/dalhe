// Tailwind classes for each pace, from the tokens in src/app.css (Sprint 1.5, F5).
// Written out in full so Tailwind sees every class name.

import type { Pace } from './index';

// Solid fill: sector bars, dots.
export const paceBg: Record<Pace, string> = {
	record: 'bg-pace-record',
	sessionBest: 'bg-pace-session-best',
	onPace: 'bg-pace-on-pace',
	offPace: 'bg-pace-off-pace',
	neutral: 'bg-pace-neutral'
};

// Coloured text: sector times in the table.
export const paceText: Record<Pace, string> = {
	record: 'text-pace-record',
	sessionBest: 'text-pace-session-best',
	onPace: 'text-pace-on-pace',
	offPace: 'text-pace-off-pace',
	neutral: 'text-pace-neutral'
};

// Dimmed background in the pace's undertone: badges, table cells.
export const paceUndertoneBg: Record<Pace, string> = {
	record: 'bg-pace-record-undertone',
	sessionBest: 'bg-pace-session-best-undertone',
	onPace: 'bg-pace-on-pace-undertone',
	offPace: 'bg-pace-off-pace-undertone',
	neutral: 'bg-pace-neutral-undertone'
};
