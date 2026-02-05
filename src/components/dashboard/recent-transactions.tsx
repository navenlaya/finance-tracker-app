"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { Transaction } from "@/types";
import { formatCurrency, formatDate, getCategoryColor, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface RecentTransactionsProps {
  transactions: (Transaction & { accounts: { name: string; institution_name: string | null } })[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground">No transactions yet</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/app/transactions">Add your first transaction</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {transactions.map((transaction) => {
        const isIncome = transaction.amount < 0;
        const displayAmount = Math.abs(transaction.amount);

        return (
          <Link
            key={transaction.id}
            href={`/app/transactions?id=${transaction.id}`}
            className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-accent"
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                isIncome ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
              )}
            >
              {isIncome ? (
                <ArrowDownRight className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <ArrowUpRight className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {transaction.merchant_name || transaction.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDate(transaction.date)} • {transaction.category || "Uncategorized"}
              </p>
            </div>

            <div className="text-right">
              <p
                className={cn(
                  "font-medium",
                  isIncome ? "text-green-600 dark:text-green-400" : ""
                )}
              >
                {isIncome ? "+" : "-"}
                {formatCurrency(displayAmount)}
              </p>
              <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                {transaction.accounts?.name}
              </p>
            </div>
          </Link>
        );
      })}

      <div className="pt-2">
        <Button variant="ghost" className="w-full" asChild>
          <Link href="/app/transactions">View all transactions</Link>
        </Button>
      </div>
    </div>
  );
}
