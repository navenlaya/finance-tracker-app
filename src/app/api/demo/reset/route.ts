import { NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import {
  generateDemoAccounts,
  generateDemoTransactions,
  generateDemoBudgets,
} from "@/lib/demo-data";
import type { InsertAccount, InsertTransaction, InsertBudget } from "@/types/database";

/**
 * Reset demo data
 * POST /api/demo/reset
 */
export async function POST() {
  try {
    const user = await requireAuth();
    const supabase = await createServerSupabaseClient();

    // Delete all existing data for this user
    // Order matters due to foreign key constraints
    await supabase.from("transactions").delete().eq("user_id", user.id);
    await supabase.from("budgets").delete().eq("user_id", user.id);
    await supabase.from("accounts").delete().eq("user_id", user.id);
    await supabase.from("plaid_items").delete().eq("user_id", user.id);

    // Generate new demo data
    const accounts = generateDemoAccounts(user.id);
    const transactions = generateDemoTransactions(
      user.id,
      accounts.map((a) => ({ id: a.id, type: a.type })),
      90,
      100
    );
    const budgets = generateDemoBudgets(user.id);

    // Insert new data
    const { error: accountsError } = await supabase
      .from("accounts")
      .insert(accounts as InsertAccount[]);

    if (accountsError) {
      console.error("Error inserting accounts:", accountsError);
      throw new Error("Failed to create demo accounts");
    }

    const { error: transactionsError } = await supabase
      .from("transactions")
      .insert(transactions as InsertTransaction[]);

    if (transactionsError) {
      console.error("Error inserting transactions:", transactionsError);
      throw new Error("Failed to create demo transactions");
    }

    const { error: budgetsError } = await supabase
      .from("budgets")
      .insert(budgets as InsertBudget[]);

    if (budgetsError) {
      console.error("Error inserting budgets:", budgetsError);
      throw new Error("Failed to create demo budgets");
    }

    return NextResponse.json({
      success: true,
      accountsCreated: accounts.length,
      transactionsCreated: transactions.length,
      budgetsCreated: budgets.length,
    });
  } catch (error) {
    console.error("Reset demo error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reset demo" },
      { status: 500 }
    );
  }
}
