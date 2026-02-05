"use client";

import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccounts, useTotalBalance } from "@/hooks/use-accounts";
import { useTransactions, useMonthlySpending } from "@/hooks/use-transactions";
import { useBudgetsWithSpending } from "@/hooks/use-budgets";
import { formatCurrency, formatDate, getCategoryColor } from "@/lib/utils";
import { SpendingChart } from "./spending-chart";
import { CategoryChart } from "./category-chart";
import { RecentTransactions } from "./recent-transactions";
import { BudgetOverview } from "./budget-overview";
import { AccountsList } from "./accounts-list";
import { EmptyState } from "@/components/empty-state";

export function DashboardContent() {
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: transactionsData, isLoading: transactionsLoading } = useTransactions();
  const { data: budgets, isLoading: budgetsLoading } = useBudgetsWithSpending();
  const { total: totalBalance } = useTotalBalance();
  const monthlySpending = useMonthlySpending();

  const isLoading = accountsLoading || transactionsLoading;

  // Calculate stats
  const transactions = transactionsData?.data || [];
  const currentMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().slice(0, 7);

  const lastMonthTransactions = transactions.filter((t) =>
    t.date.startsWith(lastMonthStr)
  );
  const lastMonthExpenses = lastMonthTransactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseChange =
    lastMonthExpenses > 0
      ? ((monthlySpending.expenses - lastMonthExpenses) / lastMonthExpenses) * 100
      : 0;

  // Category breakdown for current month
  const categoryBreakdown = React.useMemo(() => {
    const currentMonthTransactions = transactions.filter(
      (t) => t.date.startsWith(currentMonth) && t.amount > 0
    );

    const byCategory: Record<string, number> = {};
    currentMonthTransactions.forEach((t) => {
      const category = t.category || "Other";
      byCategory[category] = (byCategory[category] || 0) + t.amount;
    });

    const total = Object.values(byCategory).reduce((sum, v) => sum + v, 0);

    return Object.entries(byCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        color: getCategoryColor(category),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [transactions, currentMonth]);

  // Spending trend data
  const spendingTrend = React.useMemo(() => {
    const last30Days: Record<string, { date: string; amount: number; income: number }> = {};
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      last30Days[dateStr] = { date: dateStr, amount: 0, income: 0 };
    }

    transactions.forEach((t) => {
      if (last30Days[t.date]) {
        if (t.amount > 0) {
          last30Days[t.date].amount += t.amount;
        } else {
          last30Days[t.date].income += Math.abs(t.amount);
        }
      }
    });

    return Object.values(last30Days);
  }, [transactions]);

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (!accounts?.length) {
    return (
      <EmptyState
        icon={Wallet}
        title="No accounts yet"
        description="Add your first account to start tracking your finances. You can connect a bank with Plaid or add accounts manually."
        actionLabel="Go to Settings"
        actionHref="/app/settings"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Balance"
          value={formatCurrency(totalBalance)}
          description={`Across ${accounts.length} account${accounts.length !== 1 ? "s" : ""}`}
          icon={Wallet}
          iconColor="text-blue-500"
        />
        <KPICard
          title="Monthly Income"
          value={formatCurrency(monthlySpending.income)}
          description="This month"
          icon={ArrowDownRight}
          iconColor="text-green-500"
        />
        <KPICard
          title="Monthly Expenses"
          value={formatCurrency(monthlySpending.expenses)}
          description={
            expenseChange !== 0
              ? `${expenseChange > 0 ? "+" : ""}${expenseChange.toFixed(1)}% vs last month`
              : "This month"
          }
          icon={ArrowUpRight}
          iconColor="text-red-500"
          trend={expenseChange}
        />
        <KPICard
          title="Net Change"
          value={formatCurrency(monthlySpending.net)}
          description="This month"
          icon={monthlySpending.net >= 0 ? TrendingUp : TrendingDown}
          iconColor={monthlySpending.net >= 0 ? "text-green-500" : "text-red-500"}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending Trend</CardTitle>
            <CardDescription>Daily expenses over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {spendingTrend.some((d) => d.amount > 0) ? (
              <SpendingChart data={spendingTrend} />
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                No spending data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Where your money goes this month</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length > 0 ? (
              <CategoryChart data={categoryBreakdown} />
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                No spending data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activity</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTransactions transactions={transactions.slice(0, 5)} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <AccountsList accounts={accounts} />
            </CardContent>
          </Card>

          {budgets && budgets.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Budget Status</CardTitle>
              </CardHeader>
              <CardContent>
                <BudgetOverview budgets={budgets.slice(0, 3)} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  trend?: number;
}

function KPICard({ title, value, description, icon: Icon, iconColor, trend }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {trend !== undefined && trend !== 0 && (
            <span className={trend > 0 ? "text-red-500" : "text-green-500"}>
              {trend > 0 ? "↑" : "↓"}{" "}
            </span>
          )}
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function DashboardLoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
