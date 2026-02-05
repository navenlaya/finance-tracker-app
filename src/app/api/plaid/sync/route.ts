import { NextRequest, NextResponse } from "next/server";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encryption";
import { parsePlaidCategory } from "@/lib/utils";
import { z } from "zod";
import type { PlaidItem, InsertTransaction, UpdateTransaction, UpdateAccount } from "@/types/database";

// Initialize Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments] || PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

const syncSchema = z.object({
  plaidItemId: z.string().uuid(),
});

/**
 * Sync transactions for a Plaid item
 * POST /api/plaid/sync
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Plaid is configured
    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET || !process.env.ENCRYPTION_KEY) {
      return NextResponse.json(
        { error: "Plaid is not configured" },
        { status: 400 }
      );
    }

    const user = await requireAuth();
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    // Validate input
    const result = syncSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { plaidItemId } = result.data;

    // Get the Plaid item
    const { data: plaidItem, error: plaidItemError } = await supabase
      .from("plaid_items")
      .select("*")
      .eq("id", plaidItemId)
      .eq("user_id", user.id)
      .single();

    if (plaidItemError || !plaidItem) {
      return NextResponse.json(
        { error: "Plaid item not found" },
        { status: 404 }
      );
    }

    const plaidItemData = plaidItem as PlaidItem;

    // Decrypt access token
    const accessToken = decrypt(plaidItemData.access_token_encrypted);

    // Get account mapping
    const { data: accounts } = await supabase
      .from("accounts")
      .select("id, plaid_account_id")
      .eq("plaid_item_id", plaidItemId);

    const accountMap = new Map(
      accounts?.map((a: { id: string; plaid_account_id: string | null }) => [a.plaid_account_id, a.id]) || []
    );

    // Use transactions sync endpoint
    let cursor = plaidItemData.cursor || undefined;
    let hasMore = true;
    let transactionsAdded = 0;
    let transactionsModified = 0;
    let transactionsRemoved = 0;
    let accountsUpdated = 0;

    while (hasMore) {
      const syncResponse = await plaidClient.transactionsSync({
        access_token: accessToken,
        cursor: cursor,
        count: 500,
      });

      const { added, modified, removed, next_cursor, has_more } = syncResponse.data;

      // Process added transactions
      if (added.length > 0) {
        const transactionsToInsert: InsertTransaction[] = added
          .filter((t) => accountMap.has(t.account_id))
          .map((t) => ({
            user_id: user.id,
            account_id: accountMap.get(t.account_id)!,
            plaid_transaction_id: t.transaction_id,
            date: t.date,
            name: t.name,
            merchant_name: t.merchant_name || null,
            amount: t.amount,
            currency: t.iso_currency_code || "USD",
            category: parsePlaidCategory(t.personal_finance_category, t.category),
            pending: t.pending,
            is_manual: false,
          }));

        if (transactionsToInsert.length > 0) {
          const { error } = await supabase
            .from("transactions")
            .upsert(transactionsToInsert, {
              onConflict: "user_id,plaid_transaction_id",
            });

          if (!error) {
            transactionsAdded += transactionsToInsert.length;
          }
        }
      }

      // Process modified transactions
      if (modified.length > 0) {
        for (const t of modified) {
          const accountId = accountMap.get(t.account_id);
          if (!accountId) continue;

          const updateData: UpdateTransaction = {
            date: t.date,
            name: t.name,
            merchant_name: t.merchant_name || null,
            amount: t.amount,
            category: parsePlaidCategory(t.personal_finance_category, t.category),
            pending: t.pending,
          };

          const { error } = await supabase
            .from("transactions")
            .update(updateData)
            .eq("plaid_transaction_id", t.transaction_id)
            .eq("user_id", user.id);

          if (!error) {
            transactionsModified++;
          }
        }
      }

      // Process removed transactions
      if (removed.length > 0) {
        const removedIds = removed.map((t) => t.transaction_id);
        const { error } = await supabase
          .from("transactions")
          .delete()
          .in("plaid_transaction_id", removedIds)
          .eq("user_id", user.id);

        if (!error) {
          transactionsRemoved += removed.length;
        }
      }

      cursor = next_cursor;
      hasMore = has_more;
    }

    // Update account balances
    const balancesResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    for (const account of balancesResponse.data.accounts) {
      const accountId = accountMap.get(account.account_id);
      if (!accountId) continue;

      const updateData: UpdateAccount = {
        current_balance: account.balances.current,
        available_balance: account.balances.available,
      };

      const { error } = await supabase
        .from("accounts")
        .update(updateData)
        .eq("id", accountId);

      if (!error) {
        accountsUpdated++;
      }
    }

    // Save cursor for next sync
    await supabase
      .from("plaid_items")
      .update({ cursor } as { cursor: string | null })
      .eq("id", plaidItemId);

    return NextResponse.json({
      transactionsAdded,
      transactionsModified,
      transactionsRemoved,
      accountsUpdated,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync transactions" },
      { status: 500 }
    );
  }
}
