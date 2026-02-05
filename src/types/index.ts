/**
 * Application types
 */

export * from "./database";

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Dashboard analytics types
export interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netChange: number;
  previousMonthExpenses: number;
  accountCount: number;
  transactionCount: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface SpendingTrend {
  date: string;
  amount: number;
  income: number;
}

export interface TopMerchant {
  name: string;
  amount: number;
  count: number;
}

// Budget with spending
export interface BudgetWithSpending {
  id: string;
  category: string;
  month: string;
  limit_amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
}

// Transaction filters
export interface TransactionFilters {
  search?: string;
  accountId?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

// Plaid types
export interface PlaidLinkTokenResponse {
  linkToken: string;
  expiration: string;
}

export interface PlaidExchangeRequest {
  publicToken: string;
  institutionId?: string;
  institutionName?: string;
}

export interface PlaidSyncResponse {
  accountsAdded: number;
  accountsUpdated: number;
  transactionsAdded: number;
  transactionsModified: number;
  transactionsRemoved: number;
}

// Demo data generation
export interface DemoDataConfig {
  accountCount: number;
  transactionsPerAccount: number;
  startDate: Date;
  endDate: Date;
}

// Account types for display
export type AccountType = 
  | "depository"
  | "credit"
  | "loan"
  | "investment"
  | "other";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  depository: "Bank Account",
  credit: "Credit Card",
  loan: "Loan",
  investment: "Investment",
  other: "Other",
};

// User session
export interface UserSession {
  id: string;
  isAnonymous: boolean;
  email?: string;
  createdAt: string;
}
