"use client";

import * as React from "react";
import { Plus, Search, Filter, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTransactions } from "@/hooks/use-transactions";
import { useAccounts } from "@/hooks/use-accounts";
import { DEFAULT_CATEGORIES } from "@/lib/utils";
import { TransactionsList } from "@/components/transactions/transactions-list";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { TransactionsSkeleton } from "@/components/transactions/transactions-skeleton";
import { EmptyState } from "@/components/empty-state";
import type { TransactionFilters } from "@/types";

export default function TransactionsPage() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<TransactionFilters>({});
  const [searchInput, setSearchInput] = React.useState("");

  const { data: transactionsData, isLoading: transactionsLoading } = useTransactions(filters);
  const { data: accounts, isLoading: accountsLoading } = useAccounts();

  const isLoading = transactionsLoading || accountsLoading;
  const transactions = transactionsData?.data || [];

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchInput || undefined,
      }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== ""
  ).length;

  const clearFilters = () => {
    setFilters({});
    setSearchInput("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            View and manage all your transactions
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Account filter */}
        <Select
          value={filters.accountId || "all"}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              accountId: value === "all" ? undefined : value,
            }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            {accounts?.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category filter */}
        <Select
          value={filters.category || "all"}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              category: value === "all" ? undefined : value,
            }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {DEFAULT_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Active filters display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary">
              Search: &quot;{filters.search}&quot;
              <button
                className="ml-1 hover:text-foreground"
                onClick={() => {
                  setSearchInput("");
                  setFilters((prev) => ({ ...prev, search: undefined }));
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.accountId && (
            <Badge variant="secondary">
              Account: {accounts?.find((a) => a.id === filters.accountId)?.name}
              <button
                className="ml-1 hover:text-foreground"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, accountId: undefined }))
                }
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.category && (
            <Badge variant="secondary">
              Category: {filters.category}
              <button
                className="ml-1 hover:text-foreground"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, category: undefined }))
                }
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-muted-foreground">
          Showing {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Transactions list */}
      {isLoading ? (
        <TransactionsSkeleton />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={Filter}
          title={activeFilterCount > 0 ? "No matching transactions" : "No transactions yet"}
          description={
            activeFilterCount > 0
              ? "Try adjusting your filters or search term"
              : "Add your first transaction to start tracking your finances"
          }
          actionLabel={activeFilterCount > 0 ? "Clear filters" : "Add Transaction"}
          onAction={activeFilterCount > 0 ? clearFilters : () => setIsDialogOpen(true)}
        />
      ) : (
        <TransactionsList
          transactions={transactions}
          accounts={accounts || []}
        />
      )}

      {/* Add/Edit Dialog */}
      <TransactionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        accounts={accounts || []}
      />
    </div>
  );
}
