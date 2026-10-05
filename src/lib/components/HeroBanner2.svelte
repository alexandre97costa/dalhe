<script lang="ts">
	import { Hourglass } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	type HeroBannerInput = {
		label: string;
		duration: string;
		title: string;
		target: string;
		laps: string;
		car: string;
		cta: string;
	};

	export let data: HeroBannerInput = {
		label: "Today's challenge",
		duration: 'ends in 15 min',
		title: 'Circuit de Spa',
		target: '02:16.840',
		laps: '5 laps maximum',
		car: 'Porsche 992 GT3 R',
		cta: "Start today's session"
	};
</script>

<!-- fa8b2e -->
<!-- bg-[linear-gradient(44deg,_#fd6626_0%,_#f28507_29%,_#f3910f_80%,_#f5b324_100%)] -->

<div class="flex w-full rounded-3xl border-2 border-white/20 bg-[#fa8b2e] p-4">
	Today's challenge:
	<Badge variant="ghost" size="lg" class="ml-2">
		<Hourglass  data-icon="inline-start" class="ml-1" size="32" strokeWidth="3" />
		{data.duration}
	</Badge>
</div>
