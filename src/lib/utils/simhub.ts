// Human labels for SimHub values (Sprint 1.5, F7). Shared by the lounge load and components.

import { m } from '$lib/paraglide/messages.js';
import type { RainIntensity, SessionStats } from '$lib/types/rig';

// SimHub ids (brands_hatch, audi_r8_lms_evo) read well enough with spaces and capitals:
// "Brands Hatch", "Audi R8 Lms Evo". The fallback label when an id isn't in the catalog.
export function humanizeSimhubId(id: string | null | undefined): string | null {
	if (id === null || id === undefined || id === '') return null;
	return id
		.toLowerCase()
		.split('_')
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

// SessionTypeName as SimHub sends it: PRACTICE, HOTLAP, RACE, 7 (hotstint), 8 (superpole).
// Anything else (or a missing value) is "Session". Numbers may arrive as strings.
export function sessionTypeLabel(
	type: SessionStats['SessionTypeName'] | string | null | undefined
): string {
	switch (String(type ?? '').toUpperCase()) {
		case 'PRACTICE':
			return m.lounge_session_type_practice();
		case 'HOTLAP':
			return m.lounge_session_type_hotlap();
		case 'RACE':
			return m.lounge_session_type_race();
		case '7':
			return m.lounge_session_type_hotstint();
		case '8':
			return m.lounge_session_type_superpole();
		default:
			return m.lounge_session_type_unknown();
	}
}

// ACC rain values: "No rain", "Drizzle", "Light rain", "Medium rain", "Heavy rain", "Thunderstorm".
// Null for a missing or unknown value (e.g. stats stored before the rainIntensity rename).
export function rainLabel(rain: RainIntensity | string | null | undefined): string | null {
	switch (rain) {
		case 'ACC_NO_RAIN':
			return m.lounge_rain_none();
		case 'ACC_DRIZZLE':
			return m.lounge_rain_drizzle();
		case 'ACC_LIGHT_RAIN':
			return m.lounge_rain_light();
		case 'ACC_MEDIUM_RAIN':
			return m.lounge_rain_medium();
		case 'ACC_HEAVY_RAIN':
			return m.lounge_rain_heavy();
		case 'ACC_THUNDERSTORM':
			return m.lounge_rain_thunderstorm();
		default:
			return null;
	}
}

// 0 (no rain) to 5 (thunderstorm), for picking a weather icon. Null when unknown.
export function rainLevel(rain: RainIntensity | string | null | undefined): number | null {
	const levels: string[] = [
		'ACC_NO_RAIN',
		'ACC_DRIZZLE',
		'ACC_LIGHT_RAIN',
		'ACC_MEDIUM_RAIN',
		'ACC_HEAVY_RAIN',
		'ACC_THUNDERSTORM'
	];
	const level = levels.indexOf(rain ?? '');
	return level === -1 ? null : level;
}
