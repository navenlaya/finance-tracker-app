"use client";

import * as React from "react";
import { MoreHorizontal, Pencil, Trash2, AlertTriangle } from "lucide-react";
import type { BudgetWithSpending } from "@/types";
import { formatCurrency, getCategoryColor, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { useDeleteBudget } from "@/hooks/use-budgets";
import { BudgetDialog } from "./budget-dialog";

interface BudgetCardProps {
  budget: BudgetWithSpending;
}

export function BudgetCard({ budget }: BudgetCardProps) {
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const { mutate: deleteBudget, isPending: isDeleting } = useDeleteBudget();

  const handleDelete = () => {
    deleteBudget(budget.id);
    setIsDeleteOpen(false);
  };

  const categoryColor = getCategoryColor(budget.category);

  return (
    <>
      <Card
        className={cn(
          "relative overflow-hidden",
          budget.isOverBudget && "border-destructive"
        )}
      >
        {/* Color indicator */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: categoryColor }}
        />

        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            {budget.category}
            {budget.isOverBudget && (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsDeleteOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="pl-4 space-y-3">
          {/* Progress bar */}
          <Progress
            value={Math.min(budget.percentage, 100)}
            className="h-3"
            indicatorClassName={cn(
              budget.isOverBudget
                ? "bg-destructive"
                : budget.percentage > 80
                ? "bg-warning"
                : "bg-success"
            )}
          />

          {/* Stats */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold">
                {formatCurrency(budget.spent)}
              </p>
              <p className="text-sm text-muted-foreground">
                of {formatCurrency(budget.limit_amount)}
              </p>
            </div>
            <div className="text-right">
              <p
                className={cn(
                  "text-lg font-semibold",
                  budget.remaining < 0
                    ? "text-destructive"
                    : "text-success"
                )}
              >
                {budget.remaining < 0 ? "-" : ""}
                {formatCurrency(Math.abs(budget.remaining))}
              </p>
              <p className="text-sm text-muted-foreground">
                {budget.remaining < 0 ? "over budget" : "remaining"}
              </p>
            </div>
          </div>

          {/* Percentage */}
          <p className="text-xs text-muted-foreground text-center">
            {budget.percentage.toFixed(0)}% of budget used
          </p>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <BudgetDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        budget={budget}
        month={budget.month}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete your {budget.category} budget for this month.
              This action cannot be undone.
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
