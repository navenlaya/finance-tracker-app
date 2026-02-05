import { generateId, DEFAULT_CATEGORIES, getCategoryColor } from "./utils";
import type { Account, Transaction, Budget } from "@/types";

/**
 * Demo data generation for new users.
 * Creates realistic sample data for demonstration purposes.
 */

// Merchant data for realistic transactions
const MERCHANTS = {
  "Food & Dining": [
    "Starbucks",
    "Chipotle",
    "Whole Foods",
    "Trader Joe's",
    "DoorDash",
    "Uber Eats",
    "Local Restaurant",
    "Pizza Place",
    "Sushi Bar",
    "Coffee Shop",
  ],
  Shopping: [
    "Amazon",
    "Target",
    "Walmart",
    "Best Buy",
    "Apple Store",
    "Home Depot",
    "IKEA",
    "Costco",
    "Nordstrom",
    "REI",
  ],
  Transportation: [
    "Shell Gas",
    "Uber",
    "Lyft",
    "Public Transit",
    "Parking Garage",
    "Car Wash",
    "Auto Parts Store",
    "Chevron",
  ],
  Entertainment: [
    "Netflix",
    "Spotify",
    "AMC Theaters",
    "Steam",
    "PlayStation Store",
    "Concert Tickets",
    "Bowling Alley",
    "Mini Golf",
  ],
  "Bills & Utilities": [
    "Electric Company",
    "Water Utility",
    "Internet Provider",
    "Phone Bill",
    "Insurance Co",
    "Rent Payment",
    "Gym Membership",
  ],
  Healthcare: [
    "CVS Pharmacy",
    "Walgreens",
    "Doctor's Office",
    "Dental Office",
    "Eye Care",
    "Health Insurance",
  ],
  Travel: [
    "Delta Airlines",
    "United Airlines",
    "Airbnb",
    "Hotels.com",
    "Hertz Rental",
    "Airport Parking",
  ],
  Education: [
    "Coursera",
    "Udemy",
    "Book Store",
    "School Supplies",
    "Online Course",
  ],
  "Personal Care": [
    "Hair Salon",
    "Spa & Wellness",
    "Sephora",
    "Skincare Store",
  ],
  Income: [
    "Payroll - Direct Deposit",
    "Freelance Payment",
    "Investment Dividend",
    "Refund",
    "Interest Payment",
  ],
};

// Amount ranges by category (min, max)
const AMOUNT_RANGES: Record<string, [number, number]> = {
  "Food & Dining": [5, 80],
  Shopping: [15, 200],
  Transportation: [3, 75],
  Entertainment: [10, 50],
  "Bills & Utilities": [50, 250],
  Healthcare: [20, 150],
  Travel: [100, 500],
  Education: [15, 100],
  "Personal Care": [20, 100],
  Income: [-2000, -5000], // Negative = income
  Transfer: [-500, 500],
  Other: [10, 100],
};

/**
 * Generate a random number between min and max
 */
function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generate a random date within the last N days
 */
function randomDateInRange(daysBack: number): Date {
  const now = new Date();
  const pastDate = new Date();
  pastDate.setDate(now.getDate() - daysBack);
  
  const randomTime = pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime());
  return new Date(randomTime);
}

/**
 * Generate demo accounts
 */
export function generateDemoAccounts(userId: string): Omit<Account, "created_at" | "updated_at">[] {
  return [
    {
      id: generateId(),
      user_id: userId,
      plaid_item_id: null,
      plaid_account_id: null,
      name: "Primary Checking",
      official_name: "Personal Checking Account",
      mask: "4521",
      type: "depository",
      subtype: "checking",
      current_balance: 4852.34,
      available_balance: 4752.34,
      institution_name: "Demo Bank",
      is_manual: true,
    },
    {
      id: generateId(),
      user_id: userId,
      plaid_item_id: null,
      plaid_account_id: null,
      name: "Savings Account",
      official_name: "High-Yield Savings",
      mask: "8832",
      type: "depository",
      subtype: "savings",
      current_balance: 12450.00,
      available_balance: 12450.00,
      institution_name: "Demo Bank",
      is_manual: true,
    },
    {
      id: generateId(),
      user_id: userId,
      plaid_item_id: null,
      plaid_account_id: null,
      name: "Travel Rewards Card",
      official_name: "Platinum Travel Rewards",
      mask: "2234",
      type: "credit",
      subtype: "credit card",
      current_balance: 1543.21,
      available_balance: null,
      institution_name: "Demo Credit Union",
      is_manual: true,
    },
  ];
}

/**
 * Generate demo transactions
 */
export function generateDemoTransactions(
  userId: string,
  accounts: { id: string; type: string }[],
  daysBack: number = 90,
  count: number = 100
): Omit<Transaction, "created_at" | "updated_at">[] {
  const transactions: Omit<Transaction, "created_at" | "updated_at">[] = [];
  
  const checkingAccount = accounts.find(a => a.type === "depository");
  const creditAccount = accounts.find(a => a.type === "credit");
  
  if (!checkingAccount) return transactions;
  
  // Generate regular transactions
  for (let i = 0; i < count; i++) {
    // Pick random category, weighted towards common ones
    const categoryWeights = [
      { category: "Food & Dining", weight: 25 },
      { category: "Shopping", weight: 15 },
      { category: "Transportation", weight: 10 },
      { category: "Entertainment", weight: 10 },
      { category: "Bills & Utilities", weight: 8 },
      { category: "Healthcare", weight: 5 },
      { category: "Travel", weight: 3 },
      { category: "Education", weight: 3 },
      { category: "Personal Care", weight: 5 },
      { category: "Income", weight: 8 },
      { category: "Other", weight: 8 },
    ];
    
    const totalWeight = categoryWeights.reduce((sum, c) => sum + c.weight, 0);
    let random = Math.random() * totalWeight;
    let category = "Other";
    
    for (const c of categoryWeights) {
      if (random <= c.weight) {
        category = c.category;
        break;
      }
      random -= c.weight;
    }
    
    // Get merchant for category
    const merchantList = MERCHANTS[category as keyof typeof MERCHANTS] || ["General Purchase"];
    const merchant = merchantList[Math.floor(Math.random() * merchantList.length)];
    
    // Get amount range
    const [min, max] = AMOUNT_RANGES[category] || [10, 100];
    let amount = parseFloat(randomBetween(min, max).toFixed(2));
    
    // Income should be negative (credit)
    if (category === "Income") {
      amount = -Math.abs(amount);
    }
    
    // Decide which account
    const useCredit = creditAccount && category !== "Income" && Math.random() > 0.6;
    const account = useCredit ? creditAccount : checkingAccount;
    
    const date = randomDateInRange(daysBack);
    
    transactions.push({
      id: generateId(),
      user_id: userId,
      account_id: account.id,
      plaid_transaction_id: null,
      date: date.toISOString().split("T")[0],
      name: merchant,
      merchant_name: merchant,
      amount,
      currency: "USD",
      category,
      pending: Math.random() > 0.95, // 5% pending
      note: null,
      is_manual: true,
    });
  }
  
  // Add recurring income (paychecks)
  const today = new Date();
  for (let i = 0; i < 3; i++) {
    const payDate = new Date(today);
    payDate.setDate(1); // First of month
    payDate.setMonth(today.getMonth() - i);
    
    if (payDate <= today) {
      transactions.push({
        id: generateId(),
        user_id: userId,
        account_id: checkingAccount.id,
        plaid_transaction_id: null,
        date: payDate.toISOString().split("T")[0],
        name: "Payroll - Direct Deposit",
        merchant_name: "Employer Inc",
        amount: -3500.00,
        currency: "USD",
        category: "Income",
        pending: false,
        note: "Monthly salary",
        is_manual: true,
      });
      
      // Mid-month paycheck
      const midMonth = new Date(payDate);
      midMonth.setDate(15);
      if (midMonth <= today) {
        transactions.push({
          id: generateId(),
          user_id: userId,
          account_id: checkingAccount.id,
          plaid_transaction_id: null,
          date: midMonth.toISOString().split("T")[0],
          name: "Payroll - Direct Deposit",
          merchant_name: "Employer Inc",
          amount: -3500.00,
          currency: "USD",
          category: "Income",
          pending: false,
          note: "Monthly salary",
          is_manual: true,
        });
      }
    }
  }
  
  // Sort by date descending
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return transactions;
}

/**
 * Generate demo budgets for current month
 */
export function generateDemoBudgets(userId: string): Omit<Budget, "created_at" | "updated_at">[] {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthStr = monthStart.toISOString().split("T")[0];
  
  return [
    {
      id: generateId(),
      user_id: userId,
      category: "Food & Dining",
      month: monthStr,
      limit_amount: 600,
    },
    {
      id: generateId(),
      user_id: userId,
      category: "Shopping",
      month: monthStr,
      limit_amount: 400,
    },
    {
      id: generateId(),
      user_id: userId,
      category: "Transportation",
      month: monthStr,
      limit_amount: 200,
    },
    {
      id: generateId(),
      user_id: userId,
      category: "Entertainment",
      month: monthStr,
      limit_amount: 150,
    },
    {
      id: generateId(),
      user_id: userId,
      category: "Bills & Utilities",
      month: monthStr,
      limit_amount: 500,
    },
  ];
}
