<script>
	import { title } from '$lib/store.js';
	import { m } from '$lib/paraglide/messages.js';

	title.clear();
</script>

<div class="">
	<p class="text-xl font-medium">{m.hello_world()}</p>

	<br>
	<p>Current challenge:</p>
	<ul class="list-disc list-inside">
		<li>User Session</li>
	</ul>
</div>
