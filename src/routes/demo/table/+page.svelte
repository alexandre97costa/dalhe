<script>
	import DataTable from './data-table.svelte';
	import { columns } from '../tablets/columns';

	let { data } = $props();
</script>

<div class="flex flex-col gap-10">
	<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">Timeline</h1>

<div class="flex flex-col gap-3">

	<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">Timeline</h1>
	
	<DataTable data={data.payments} {columns} />
</div>
