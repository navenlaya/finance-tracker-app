"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DEFAULT_CATEGORIES } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateBudget, useUpdateBudget } from "@/hooks/use-budgets";

const budgetFormSchema = z.object({
  category: z.string().min(1, "Please select a category"),
  limit_amount: z.string().min(1, "Amount is required"),
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

// Accept a minimal budget type for editing
interface BudgetForDialog {
  id: string;
  category: string;
  limit_amount: number;
}

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
  budget?: BudgetForDialog | null;
}

export function BudgetDialog({
  open,
  onOpenChange,
  month,
  budget,
}: BudgetDialogProps) {
  const isEditing = !!budget;

  const { mutate: createBudget, isPending: isCreating } = useCreateBudget();
  const { mutate: updateBudget, isPending: isUpdating } = useUpdateBudget();

  const isPending = isCreating || isUpdating;

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      category: "",
      limit_amount: "",
    },
  });

  // Reset form when dialog opens/closes or budget changes
  React.useEffect(() => {
    if (open) {
      if (budget) {
        form.reset({
          category: budget.category,
          limit_amount: budget.limit_amount.toString(),
        });
      } else {
        form.reset({
          category: "",
          limit_amount: "",
        });
      }
    }
  }, [open, budget, form]);

  const onSubmit = (values: BudgetFormValues) => {
    const data = {
      category: values.category,
      month,
      limit_amount: parseFloat(values.limit_amount),
    };

    if (isEditing && budget) {
      updateBudget(
        { id: budget.id, ...data },
        {
          onSuccess: () => onOpenChange(false),
        }
      );
    } else {
      createBudget(data, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  // Filter out categories that already have budgets
  const availableCategories = isEditing
    ? DEFAULT_CATEGORIES
    : DEFAULT_CATEGORIES.filter((c) => c !== "Income" && c !== "Transfer");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Budget" : "Create Budget"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the budget limit for this category."
              : "Set a spending limit for a category this month."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={form.watch("category")}
              onValueChange={(value) => form.setValue("category", value)}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-destructive">
                {form.formState.errors.category.message}
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="limit_amount">Monthly Limit</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="limit_amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-7"
                {...form.register("limit_amount")}
              />
            </div>
            {form.formState.errors.limit_amount && (
              <p className="text-sm text-destructive">
                {form.formState.errors.limit_amount.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                ? "Save Changes"
                : "Create Budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
