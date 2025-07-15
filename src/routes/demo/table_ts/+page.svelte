<script lang="ts">
	import DataTable from './data-table.svelte';
	import { columns } from './columns';

	let { payments } = $props();
</script>

<DataTable data={payments} columns={ columns } />