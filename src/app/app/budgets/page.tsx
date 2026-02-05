"use client";

import * as React from "react";
import { Plus, ChevronLeft, ChevronRight, PiggyBank } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { useBudgetsWithSpending } from "@/hooks/use-budgets";
import { BudgetCard } from "@/components/budgets/budget-card";
import { BudgetDialog } from "@/components/budgets/budget-dialog";
import { BudgetsSkeleton } from "@/components/budgets/budgets-skeleton";
import { EmptyState } from "@/components/empty-state";
import { getFirstDayOfMonth, formatCurrency } from "@/lib/utils";

export default function BudgetsPage() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedMonth, setSelectedMonth] = React.useState(
    getFirstDayOfMonth()
  );

  const monthStr = selectedMonth.toISOString().split("T")[0];
  const { data: budgets, isLoading } = useBudgetsWithSpending(monthStr);

  const goToPreviousMonth = () => {
    setSelectedMonth((prev) => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setSelectedMonth((prev) => addMonths(prev, 1));
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(getFirstDayOfMonth());
  };

  // Calculate totals
  const totalBudgeted = budgets?.reduce((sum, b) => sum + b.limit_amount, 0) || 0;
  const totalSpent = budgets?.reduce((sum, b) => sum + b.spent, 0) || 0;
  const overBudgetCount = budgets?.filter((b) => b.isOverBudget).length || 0;

  const isCurrentMonth =
    selectedMonth.toISOString().split("T")[0] ===
    getFirstDayOfMonth().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">
            Set spending limits and track your progress
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Budget
        </Button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[160px] text-center">
            {format(selectedMonth, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!isCurrentMonth && (
            <Button variant="ghost" size="sm" onClick={goToCurrentMonth}>
              Today
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {budgets && budgets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Budgeted</p>
            <p className="text-2xl font-bold">{formatCurrency(totalBudgeted)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p
              className={`text-2xl font-bold ${
                totalBudgeted - totalSpent < 0
                  ? "text-destructive"
                  : "text-success"
              }`}
            >
              {formatCurrency(totalBudgeted - totalSpent)}
            </p>
            {overBudgetCount > 0 && (
              <p className="text-xs text-destructive mt-1">
                {overBudgetCount} budget{overBudgetCount !== 1 ? "s" : ""} over limit
              </p>
            )}
          </div>
        </div>
      )}

      {/* Budget Cards */}
      {isLoading ? (
        <BudgetsSkeleton />
      ) : budgets && budgets.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={PiggyBank}
          title="No budgets set"
          description="Create your first budget to start tracking your spending by category."
          actionLabel="Create Budget"
          onAction={() => setIsDialogOpen(true)}
        />
      )}

      {/* Budget Dialog */}
      <BudgetDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        month={monthStr}
      />
    </div>
  );
}
