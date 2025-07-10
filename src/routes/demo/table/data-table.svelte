<script >
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
	import * as Table from '$lib/components/ui/table/index.js';


	let { data, columns } = $props();

    const tabledata = [
        {
            id: '123',
            name: 'John',
            surname: 'Doe'
        },
        {
            id: '123',
            name: 'John',
            surname: 'Doe'
        },
        {
            id: '123',
            name: 'John',
            surname: 'Doe'
        },
        {
            id: '123',
            name: 'John',
            surname: 'Doe'
        },
    ]
</script>

<div class="rounded-md border">
	<Table.Root>
		<Table.Header>
            <Table.Row>
                    {#each tabledata as tableHeaders,i}
						<Table.Head colspan={1}>
							{Object.keys(tableHeaders)[i]}
						</Table.Head>
					{/each}
				</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each tabledata as row, j}
				<Table.Row data-state={'selected'}>
					{#each Object.keys(row) as cell, k}
						<Table.Cell>
							<FlexRender content={row[cell]} />
						</Table.Cell>
					{/each}
				</Table.Row>
			{:else}
				<Table.Row>
					<Table.Cell colspan={row.length} class="h-24 text-center">No results.</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
