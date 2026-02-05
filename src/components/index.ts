// Components barrel export

// UI components
export * from "./ui";

// App components
export { AppShell } from "./app/app-shell";

// Dashboard components  
export { DashboardContent } from "./dashboard/dashboard-content";
export { DashboardSkeleton } from "./dashboard/dashboard-skeleton";
export { SpendingChart } from "./dashboard/spending-chart";
export { CategoryChart } from "./dashboard/category-chart";
export { RecentTransactions } from "./dashboard/recent-transactions";
export { AccountsList } from "./dashboard/accounts-list";
export { BudgetOverview } from "./dashboard/budget-overview";

// Transaction components
export { TransactionsList } from "./transactions/transactions-list";
export { TransactionDialog } from "./transactions/transaction-dialog";
export { TransactionsSkeleton } from "./transactions/transactions-skeleton";

// Budget components
export { BudgetCard } from "./budgets/budget-card";
export { BudgetDialog } from "./budgets/budget-dialog";
export { BudgetsSkeleton } from "./budgets/budgets-skeleton";

// Settings components
export { AccountDialog } from "./settings/account-dialog";

// Landing components
export { EnterDemoButton } from "./landing/enter-demo-button";

// Shared components
export { ThemeToggle } from "./theme-toggle";
export { EmptyState } from "./empty-state";
export { Providers } from "./providers";
