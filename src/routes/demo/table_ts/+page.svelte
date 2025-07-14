<script lang="ts">
	import DataTable from './data-table.svelte';
	import { columnsExample, type Payment } from './columns';

	let { payments } = $props();
</script>

<DataTable data={payments} columns={columnsExample} />