import { NextRequest, NextResponse } from "next/server";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { encrypt } from "@/lib/encryption";
import { plaidExchangeSchema } from "@/lib/validations";
import { parsePlaidCategory } from "@/lib/utils";
import type { InsertPlaidItem, InsertAccount, InsertTransaction, PlaidItem } from "@/types/database";

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

/**
 * Exchange public token for access token and save accounts
 * POST /api/plaid/exchange-token
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
    const result = plaidExchangeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { publicToken, institutionId, institutionName } = result.data;

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Encrypt the access token
    const encryptedAccessToken = encrypt(accessToken);

    // Save the Plaid item
    const insertPlaidItem: InsertPlaidItem = {
      user_id: user.id,
      item_id: itemId,
      access_token_encrypted: encryptedAccessToken,
      institution_id: institutionId || null,
      institution_name: institutionName || null,
    };

    const { data: plaidItem, error: plaidItemError } = await supabase
      .from("plaid_items")
      .insert(insertPlaidItem)
      .select()
      .single();

    if (plaidItemError) {
      console.error("Error saving Plaid item:", plaidItemError);
      throw new Error("Failed to save bank connection");
    }

    const plaidItemData = plaidItem as PlaidItem;

    // Get accounts
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    // Save accounts
    const accountsToInsert: InsertAccount[] = accountsResponse.data.accounts.map((account) => ({
      user_id: user.id,
      plaid_item_id: plaidItemData.id,
      plaid_account_id: account.account_id,
      name: account.name,
      official_name: account.official_name || null,
      mask: account.mask || null,
      type: account.type,
      subtype: account.subtype || null,
      current_balance: account.balances.current,
      available_balance: account.balances.available,
      institution_name: institutionName || null,
      is_manual: false,
    }));

    const { error: accountsError } = await supabase
      .from("accounts")
      .insert(accountsToInsert);

    if (accountsError) {
      console.error("Error saving accounts:", accountsError);
      // Don't fail - we have the item saved
    }

    // Fetch initial transactions
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      const transactionsResponse = await plaidClient.transactionsGet({
        access_token: accessToken,
        start_date: thirtyDaysAgo.toISOString().split("T")[0],
        end_date: now.toISOString().split("T")[0],
        options: {
          count: 500,
          offset: 0,
        },
      });

      // Get account mapping
      const { data: savedAccounts } = await supabase
        .from("accounts")
        .select("id, plaid_account_id")
        .eq("plaid_item_id", plaidItemData.id);

      const accountMap = new Map(
        savedAccounts?.map((a: { id: string; plaid_account_id: string | null }) => [a.plaid_account_id, a.id]) || []
      );

      // Save transactions
      const transactionsToInsert: InsertTransaction[] = transactionsResponse.data.transactions
        .filter((t) => accountMap.has(t.account_id))
        .map((t) => ({
          user_id: user.id,
          account_id: accountMap.get(t.account_id)!,
          plaid_transaction_id: t.transaction_id,
          date: t.date,
          name: t.name,
          merchant_name: t.merchant_name || null,
          amount: t.amount, // Plaid: positive = debit, negative = credit
          currency: t.iso_currency_code || "USD",
          category: parsePlaidCategory(t.personal_finance_category, t.category),
          pending: t.pending,
          is_manual: false,
        }));

      if (transactionsToInsert.length > 0) {
        await supabase.from("transactions").insert(transactionsToInsert);
      }
    } catch (txError) {
      console.error("Error fetching initial transactions:", txError);
      // Don't fail - accounts are saved
    }

    return NextResponse.json({
      success: true,
      itemId: plaidItemData.id,
      accountsAdded: accountsToInsert.length,
    });
  } catch (error) {
    console.error("Exchange token error:", error);
    return NextResponse.json(
      { error: "Failed to connect bank account" },
      { status: 500 }
    );
  }
}
