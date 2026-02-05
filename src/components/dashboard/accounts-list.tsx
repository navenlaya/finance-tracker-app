"use client";

import Link from "next/link";
import { CreditCard, Building2, Wallet, PiggyBank, TrendingUp } from "lucide-react";
import type { Account } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AccountsListProps {
  accounts: Account[];
}

const ACCOUNT_ICONS: Record<string, React.ElementType> = {
  depository: Wallet,
  credit: CreditCard,
  loan: Building2,
  investment: TrendingUp,
  other: PiggyBank,
};

export function AccountsList({ accounts }: AccountsListProps) {
  if (accounts.length === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        No accounts connected
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {accounts.slice(0, 4).map((account) => {
        const Icon = ACCOUNT_ICONS[account.type] || Wallet;
        const balance = account.current_balance ?? 0;
        const isCredit = account.type === "credit";

        return (
          <div
            key={account.id}
            className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{account.name}</p>
              {account.mask && (
                <p className="text-xs text-muted-foreground">
                  •••• {account.mask}
                </p>
              )}
            </div>

            <div className="text-right">
              <p
                className={cn(
                  "text-sm font-medium",
                  isCredit && balance > 0 ? "text-red-600 dark:text-red-400" : ""
                )}
              >
                {isCredit && balance > 0 ? "-" : ""}
                {formatCurrency(Math.abs(balance))}
              </p>
            </div>
          </div>
        );
      })}

      {accounts.length > 4 && (
        <Button variant="ghost" size="sm" className="w-full" asChild>
          <Link href="/app/settings">
            View all ({accounts.length} accounts)
          </Link>
        </Button>
      )}
    </div>
  );
}
