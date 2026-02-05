import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency with proper locale
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

/**
 * Format a number with compact notation (e.g., 1.2K, 3.4M)
 */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Format a date for display
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(d);
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }

  return "Just now";
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Delay execution
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if we're running on the server
 */
export const isServer = typeof window === "undefined";

/**
 * Check if we're running in development
 */
export const isDev = process.env.NODE_ENV === "development";

/**
 * Get category color for charts
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    "Food & Dining": "#ef4444",
    Shopping: "#f97316",
    Transportation: "#eab308",
    Entertainment: "#84cc16",
    "Bills & Utilities": "#22c55e",
    Healthcare: "#14b8a6",
    Travel: "#06b6d4",
    Education: "#3b82f6",
    "Personal Care": "#8b5cf6",
    Income: "#10b981",
    Transfer: "#6b7280",
    Other: "#9ca3af",
  };
  return colors[category] || colors.Other;
}

/**
 * Default categories for transactions
 */
export const DEFAULT_CATEGORIES = [
  "Food & Dining",
  "Shopping",
  "Transportation",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Travel",
  "Education",
  "Personal Care",
  "Income",
  "Transfer",
  "Other",
] as const;

/**
 * Parse Plaid personal_finance_category to our category format
 * Plaid's new category system uses primary/detailed structure
 */
export function parsePlaidCategory(
  personalFinanceCategory: { primary: string; detailed: string } | null | undefined,
  legacyCategory?: string[] | null
): string {
  // Try new personal_finance_category first (preferred)
  if (personalFinanceCategory?.primary) {
    const primary = personalFinanceCategory.primary.toUpperCase();
    
    const categoryMap: Record<string, string> = {
      FOOD_AND_DRINK: "Food & Dining",
      GENERAL_MERCHANDISE: "Shopping",
      ENTERTAINMENT: "Entertainment",
      TRAVEL: "Travel",
      TRANSPORTATION: "Transportation",
      TRANSFER_IN: "Income",
      TRANSFER_OUT: "Transfer",
      INCOME: "Income",
      LOAN_PAYMENTS: "Bills & Utilities",
      RENT_AND_UTILITIES: "Bills & Utilities",
      MEDICAL: "Healthcare",
      PERSONAL_CARE: "Personal Care",
      GENERAL_SERVICES: "Bills & Utilities",
      GOVERNMENT_AND_NON_PROFIT: "Other",
      HOME_IMPROVEMENT: "Shopping",
      BANK_FEES: "Bills & Utilities",
    };

    if (categoryMap[primary]) {
      return categoryMap[primary];
    }
  }

  // Fallback to legacy category array
  if (legacyCategory && legacyCategory.length > 0) {
    const primary = legacyCategory[0]?.toLowerCase() || "";

    const legacyMap: Record<string, string> = {
      food: "Food & Dining",
      restaurants: "Food & Dining",
      shops: "Shopping",
      shopping: "Shopping",
      travel: "Travel",
      transportation: "Transportation",
      transfer: "Transfer",
      payment: "Bills & Utilities",
      utilities: "Bills & Utilities",
      service: "Bills & Utilities",
      healthcare: "Healthcare",
      medical: "Healthcare",
      entertainment: "Entertainment",
      recreation: "Entertainment",
      education: "Education",
      personal: "Personal Care",
    };

    for (const [key, value] of Object.entries(legacyMap)) {
      if (primary.includes(key)) return value;
    }
  }

  return "Other";
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Get first day of month
 */
export function getFirstDayOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get last day of month
 */
export function getLastDayOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
