"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { BudgetWithSpending } from "@/types";
import { formatCurrency, cn, getCategoryColor } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface BudgetOverviewProps {
  budgets: BudgetWithSpending[];
}

export function BudgetOverview({ budgets }: BudgetOverviewProps) {
  if (budgets.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-muted-foreground mb-2">No budgets set</p>
        <Button variant="link" size="sm" asChild>
          <Link href="/app/budgets">Create a budget</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {budgets.map((budget) => (
        <div key={budget.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: getCategoryColor(budget.category) }}
              />
              <span className="text-sm font-medium">{budget.category}</span>
              {budget.isOverBudget && (
                <AlertTriangle className="h-3 w-3 text-destructive" />
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {formatCurrency(budget.spent)} / {formatCurrency(budget.limit_amount)}
            </span>
          </div>
          <Progress
            value={budget.percentage}
            className="h-2"
            indicatorClassName={cn(
              budget.isOverBudget
                ? "bg-destructive"
                : budget.percentage > 80
                ? "bg-warning"
                : "bg-success"
            )}
          />
        </div>
      ))}

      <Button variant="ghost" size="sm" className="w-full" asChild>
        <Link href="/app/budgets">View all budgets</Link>
      </Button>
    </div>
  );
}
