"use client";

import * as React from "react";
import { MoreHorizontal, Pencil, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { Transaction, Account } from "@/types";
import { formatCurrency, formatDate, cn, getCategoryColor } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteTransaction } from "@/hooks/use-transactions";
import { TransactionDialog } from "./transaction-dialog";

interface TransactionsListProps {
  transactions: (Transaction & { accounts: { name: string; institution_name: string | null } })[];
  accounts: Account[];
}

export function TransactionsList({ transactions, accounts }: TransactionsListProps) {
  const [editTransaction, setEditTransaction] = React.useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const { mutate: deleteTransaction, isPending: isDeleting } = useDeleteTransaction();

  // Group transactions by date
  const groupedTransactions = React.useMemo(() => {
    const groups: Record<string, typeof transactions> = {};

    transactions.forEach((transaction) => {
      const date = transaction.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });

    return Object.entries(groups).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    );
  }, [transactions]);

  const handleDelete = () => {
    if (deleteId) {
      deleteTransaction(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {groupedTransactions.map(([date, dateTransactions]) => (
          <div key={date}>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {formatDate(date, { weekday: "long", month: "long", day: "numeric" })}
            </h3>
            <div className="space-y-1 rounded-lg border bg-card">
              {dateTransactions.map((transaction, index) => {
                const isIncome = transaction.amount < 0;
                const displayAmount = Math.abs(transaction.amount);

                return (
                  <div
                    key={transaction.id}
                    className={cn(
                      "flex items-center gap-4 p-4 transition-colors hover:bg-accent/50",
                      index !== dateTransactions.length - 1 && "border-b"
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        isIncome
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "bg-red-100 dark:bg-red-900/30"
                      )}
                    >
                      {isIncome ? (
                        <ArrowDownRight className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {transaction.merchant_name || transaction.name}
                        </p>
                        {transaction.pending && (
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="truncate">{transaction.accounts?.name}</span>
                        {transaction.category && (
                          <>
                            <span>•</span>
                            <span
                              className="inline-flex items-center gap-1"
                              style={{ color: getCategoryColor(transaction.category) }}
                            >
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: getCategoryColor(transaction.category) }}
                              />
                              {transaction.category}
                            </span>
                          </>
                        )}
                      </div>
                      {transaction.note && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          Note: {transaction.note}
                        </p>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p
                        className={cn(
                          "font-semibold",
                          isIncome ? "text-green-600 dark:text-green-400" : ""
                        )}
                      >
                        {isIncome ? "+" : "-"}
                        {formatCurrency(displayAmount)}
                      </p>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditTransaction(transaction)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(transaction.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      <TransactionDialog
        open={!!editTransaction}
        onOpenChange={(open) => !open && setEditTransaction(null)}
        accounts={accounts}
        transaction={editTransaction}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              transaction from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
