import { writable } from 'svelte/store';

function createTitle() {
	const {subscribe, set, update} = writable('');
	
	return {
		subscribe,
		set: (value) => {
			set(`${value}`)
		},
		clear: () => {
			set('Home • Dá-lhe!');
		}
	}
}

export const title = createTitle();