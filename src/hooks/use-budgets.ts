"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Budget, InsertBudget, UpdateBudget, BudgetWithSpending, Transaction } from "@/types";
import { useToast } from "./use-toast";
import { getFirstDayOfMonth } from "@/lib/utils";

/**
 * Hook to fetch all budgets for the current month
 */
export function useBudgets(month?: string) {
  const targetMonth = month || getFirstDayOfMonth().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["budgets", targetMonth],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("month", targetMonth)
        .order("category");

      if (error) throw error;
      return data as Budget[];
    },
  });
}

/**
 * Hook to fetch budgets with spending data
 */
export function useBudgetsWithSpending(month?: string) {
  const targetMonth = month || getFirstDayOfMonth().toISOString().split("T")[0];
  const monthEnd = new Date(targetMonth);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  monthEnd.setDate(0);
  const endDate = monthEnd.toISOString().split("T")[0];

  return useQuery({
    queryKey: ["budgets", "with-spending", targetMonth],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      // Fetch budgets
      const { data: budgets, error: budgetsError } = await supabase
        .from("budgets")
        .select("*")
        .eq("month", targetMonth)
        .order("category");

      if (budgetsError) throw budgetsError;

      // Fetch transactions for the month
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("category, amount")
        .gte("date", targetMonth)
        .lte("date", endDate)
        .gt("amount", 0); // Only expenses

      if (transactionsError) throw transactionsError;

      // Calculate spending by category
      const spendingByCategory: Record<string, number> = {};
      (transactions as Pick<Transaction, "category" | "amount">[]).forEach((t) => {
        if (t.category) {
          spendingByCategory[t.category] =
            (spendingByCategory[t.category] || 0) + t.amount;
        }
      });

      // Combine budgets with spending
      const budgetsWithSpending: BudgetWithSpending[] = (budgets as Budget[]).map(
        (budget) => {
          const spent = spendingByCategory[budget.category] || 0;
          const remaining = budget.limit_amount - spent;
          const percentage = (spent / budget.limit_amount) * 100;

          return {
            ...budget,
            spent,
            remaining,
            percentage: Math.min(percentage, 100),
            isOverBudget: spent > budget.limit_amount,
          };
        }
      );

      return budgetsWithSpending;
    },
  });
}

/**
 * Hook to create a budget
 */
export function useCreateBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: Omit<InsertBudget, "user_id">) => {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create budget");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({
        title: "Budget Created",
        description: "Your budget has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to update a budget
 */
export function useUpdateBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: UpdateBudget & { id: string }) => {
      const response = await fetch(`/api/budgets/${input.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update budget");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({
        title: "Budget Updated",
        description: "Your budget has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to delete a budget
 */
export function useDeleteBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/budgets/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete budget");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({
        title: "Budget Deleted",
        description: "Your budget has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
