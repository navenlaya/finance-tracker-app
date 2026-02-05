"use client";

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Transaction, InsertTransaction, UpdateTransaction, TransactionFilters } from "@/types";
import { useToast } from "./use-toast";

const PAGE_SIZE = 20;

/**
 * Hook to fetch transactions with pagination and filters
 */
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      let query = supabase
        .from("transactions")
        .select("*, accounts(name, institution_name)", { count: "exact" })
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (filters?.accountId) {
        query = query.eq("account_id", filters.accountId);
      }
      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.startDate) {
        query = query.gte("date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("date", filters.endDate);
      }
      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,merchant_name.ilike.%${filters.search}%`
        );
      }

      const { data, error, count } = await query.limit(500);

      if (error) throw error;
      return { data: data as (Transaction & { accounts: { name: string; institution_name: string | null } })[], count };
    },
  });
}

/**
 * Hook to fetch transactions with infinite scroll
 */
export function useInfiniteTransactions(filters?: Omit<TransactionFilters, "page" | "pageSize">) {
  return useInfiniteQuery({
    queryKey: ["transactions", "infinite", filters],
    queryFn: async ({ pageParam = 0 }) => {
      const supabase = getSupabaseClient();
      let query = supabase
        .from("transactions")
        .select("*, accounts(name, institution_name)", { count: "exact" })
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      if (filters?.accountId) {
        query = query.eq("account_id", filters.accountId);
      }
      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.startDate) {
        query = query.gte("date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("date", filters.endDate);
      }
      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,merchant_name.ilike.%${filters.search}%`
        );
      }

      const { data, error, count } = await query;

      if (error) throw error;
      return {
        data: data as (Transaction & { accounts: { name: string; institution_name: string | null } })[],
        count,
        nextPage: data.length === PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}

/**
 * Hook to fetch a single transaction
 */
export function useTransaction(id: string) {
  return useQuery({
    queryKey: ["transactions", id],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("transactions")
        .select("*, accounts(name, institution_name)")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Transaction & { accounts: { name: string; institution_name: string | null } };
    },
    enabled: !!id,
  });
}

/**
 * Hook to create a transaction
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: Omit<InsertTransaction, "user_id">) => {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create transaction");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Transaction Created",
        description: "Your transaction has been added successfully.",
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
 * Hook to update a transaction
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: UpdateTransaction & { id: string }) => {
      const response = await fetch(`/api/transactions/${input.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update transaction");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Transaction Updated",
        description: "Your transaction has been updated successfully.",
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
 * Hook to delete a transaction
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete transaction");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Transaction Deleted",
        description: "Your transaction has been deleted successfully.",
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
 * Get monthly spending totals
 */
export function useMonthlySpending(month?: string) {
  const { data: transactions } = useTransactions();

  if (!transactions?.data) return { income: 0, expenses: 0, net: 0 };

  const targetMonth = month || new Date().toISOString().slice(0, 7);

  const monthTransactions = transactions.data.filter((t) =>
    t.date.startsWith(targetMonth)
  );

  return monthTransactions.reduce(
    (acc, t) => {
      if (t.amount < 0) {
        acc.income += Math.abs(t.amount);
      } else {
        acc.expenses += t.amount;
      }
      acc.net = acc.income - acc.expenses;
      return acc;
    },
    { income: 0, expenses: 0, net: 0 }
  );
}
