import { NextRequest, NextResponse } from "next/server";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encryption";
import { z } from "zod";
import type { PlaidItem } from "@/types/database";

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

const disconnectSchema = z.object({
  plaidItemId: z.string().uuid(),
});

/**
 * Disconnect a Plaid item and remove associated data
 * POST /api/plaid/disconnect
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
    const result = disconnectSchema.safeParse(body);
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

    // Remove item from Plaid
    try {
      const accessToken = decrypt((plaidItem as PlaidItem).access_token_encrypted);
      await plaidClient.itemRemove({
        access_token: accessToken,
      });
    } catch (plaidError) {
      console.error("Error removing item from Plaid:", plaidError);
      // Continue with local cleanup even if Plaid removal fails
    }

    // Get associated accounts
    const { data: accounts } = await supabase
      .from("accounts")
      .select("id")
      .eq("plaid_item_id", plaidItemId);

    const accountIds = accounts?.map((a: { id: string }) => a.id) || [];

    // Delete transactions for these accounts
    if (accountIds.length > 0) {
      await supabase
        .from("transactions")
        .delete()
        .in("account_id", accountIds)
        .eq("user_id", user.id);
    }

    // Delete accounts
    await supabase
      .from("accounts")
      .delete()
      .eq("plaid_item_id", plaidItemId)
      .eq("user_id", user.id);

    // Delete Plaid item
    await supabase
      .from("plaid_items")
      .delete()
      .eq("id", plaidItemId)
      .eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect bank" },
      { status: 500 }
    );
  }
}
