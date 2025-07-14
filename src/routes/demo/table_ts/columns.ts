import type { ColumnDef } from "@tanstack/table-core";
import { createRawSnippet } from "svelte";
import { renderSnippet, renderComponent } from "$lib/components/ui/data-table/index.js";
import DataTableActions from "./data-table-actions.svelte";

export type Payment = {
    id: string;
    amount: number;
    status: "pending" | "processing" | "success" | "failed";
    email: string;
};

export const columnsExample: ColumnDef<Payment>[] = [
    {
        accessorKey: "status",
        header: "Status",
    },
    {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => {
            return renderSnippet(
                createRawSnippet<[string]>((getEmail) => {
                    const email = getEmail();
                    return {
                        render: () => `<a href="mailto:${email}">${email}</a>`
                    }
                })
            )
        }
    },
    {
        accessorKey: "amount",
        header: () => {
            const amountHeaderSnippet = createRawSnippet(() => ({
                render: () => `<div class="text-right">Amount</div>`,
            }));
            return renderSnippet(amountHeaderSnippet, "");
        },
        cell: ({ row }) => {
            const formatter = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            });

            const amountCellSnippet = createRawSnippet<[string]>((getAmount) => {
                const amount = getAmount();
                return {
                    render: () => `<div class="text-right font-medium">${amount}</div>`,
                };
            });

            return renderSnippet(
                amountCellSnippet,
                formatter.format(parseFloat(row.getValue("amount")))
            );
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            // You can pass whatever you need from `row.original` to the component
            return renderComponent(DataTableActions, { id: row.original.id });
        },
    },
];