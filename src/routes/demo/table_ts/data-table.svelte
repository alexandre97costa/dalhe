<script lang="ts" generics="TData, TValue">
	import {
		type ColumnDef,
		type PaginationState,
		getCoreRowModel,
		getPaginationRowModel
	} from '@tanstack/table-core';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index';
	import * as Table from '$lib/components/ui/table/index';
	import { Button } from "$lib/components/ui/button/index";
	import type { Payment } from './columns';

	type DataTableProps<TData, TValue> = {
		data: Payment[];
		columns: ColumnDef<Payment>[];
	};

	let { data, columns }: DataTableProps<TData, TValue> = $props();

	// let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });

	const payments: Payment[] = [
        {
            id: "728ed52f",
            amount: 100,
            status: "pending",
            email: "m@example.com",
        },
        {
            id: "489e1d42",
            amount: 125,
            status: "processing",
            email: "example@gmail.com",
        },
        // ...
    ];

	const table = createSvelteTable({
		data: payments,
		columns,
		// state: {
		// 	get pagination() {
		// 		return pagination;
		// 	}
		// },
		// onPaginationChange: (updater) => {
		// 	if (typeof updater === 'function') {
		// 		pagination = updater(pagination);
		// 	} else {
		// 		pagination = updater;
		// 	}
		// },
		getCoreRowModel: getCoreRowModel(),
		// getPaginationRowModel: getPaginationRowModel()
	});
</script>

<div>
	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<Table.Row>
						{#each headerGroup.headers as header (header.id)}
							<Table.Head colspan={header.colSpan}>
								{#if !header.isPlaceholder}
									<FlexRender
										content={header.column.columnDef.header}
										context={header.getContext()}
									/>
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>
			<Table.Body>
				{#each table.getRowModel().rows as row (row.id)}
					<Table.Row data-state={row.getIsSelected() && 'selected'}>
						{#each row.getVisibleCells() as cell (cell.id)}
							<Table.Cell>
								<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
							</Table.Cell>
						{/each}
					</Table.Row>
				{:else}
					<Table.Row>
						<!-- <Table.Cell colspan={columns.length} class="h-24 text-center">No results.</Table.Cell> -->
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
	<div class="flex items-center justify-end space-x-2 py-4">
		<Button
			variant="outline"
			size="sm"
			onclick={() => table.previousPage()}
			disabled={!table.getCanPreviousPage()}
		>
			Previous
		</Button>
		<Button
			variant="outline"
			size="sm"
			onclick={() => table.nextPage()}
			disabled={!table.getCanNextPage()}
		>
			Next
		</Button>
	</div>
</div>
