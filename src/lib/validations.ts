import { z } from "zod";
import { DEFAULT_CATEGORIES } from "./utils";

/**
 * Validation schemas for API requests and forms
 */

// Transaction schemas
export const transactionSchema = z.object({
  account_id: z.string().uuid("Invalid account ID"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  merchant_name: z.string().max(255).optional().nullable(),
  amount: z.number().finite("Amount must be a valid number"),
  currency: z.string().length(3, "Currency must be 3 characters").default("USD"),
  category: z.string().max(100).optional().nullable(),
  pending: z.boolean().default(false),
  note: z.string().max(1000).optional().nullable(),
});

export const createTransactionSchema = transactionSchema;

export const updateTransactionSchema = transactionSchema.partial().extend({
  id: z.string().uuid("Invalid transaction ID"),
});

// Budget schemas
export const budgetSchema = z.object({
  category: z.string().min(1, "Category is required").max(100),
  month: z.string().regex(/^\d{4}-\d{2}-01$/, "Month must be YYYY-MM-01 format"),
  limit_amount: z.number().positive("Budget limit must be positive").finite(),
});

export const createBudgetSchema = budgetSchema;

export const updateBudgetSchema = budgetSchema.partial().extend({
  id: z.string().uuid("Invalid budget ID"),
});

// Account schemas
export const accountSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  type: z.enum(["depository", "credit", "loan", "investment", "other"]),
  subtype: z.string().max(100).optional().nullable(),
  current_balance: z.number().finite().optional().nullable(),
  available_balance: z.number().finite().optional().nullable(),
  institution_name: z.string().max(255).optional().nullable(),
  mask: z.string().max(4).optional().nullable(),
});

export const createAccountSchema = accountSchema;

export const updateAccountSchema = accountSchema.partial().extend({
  id: z.string().uuid("Invalid account ID"),
});

// Plaid schemas
export const plaidExchangeSchema = z.object({
  publicToken: z.string().min(1, "Public token is required"),
  institutionId: z.string().optional(),
  institutionName: z.string().optional(),
});

export const plaidDisconnectSchema = z.object({
  plaidItemId: z.string().uuid("Invalid Plaid item ID"),
});

// Filter schemas
export const transactionFiltersSchema = z.object({
  search: z.string().optional(),
  accountId: z.string().uuid().optional(),
  category: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date"),
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  { message: "Start date must be before or equal to end date" }
);

// Types derived from schemas
export type TransactionInput = z.infer<typeof transactionSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

export type BudgetInput = z.infer<typeof budgetSchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;

export type AccountInput = z.infer<typeof accountSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

export type PlaidExchangeInput = z.infer<typeof plaidExchangeSchema>;
export type PlaidDisconnectInput = z.infer<typeof plaidDisconnectSchema>;

export type TransactionFiltersInput = z.infer<typeof transactionFiltersSchema>;
