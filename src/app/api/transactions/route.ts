import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { createTransactionSchema } from "@/lib/validations";
import type { InsertTransaction } from "@/types/database";

/**
 * Get all transactions for the current user
 * GET /api/transactions
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);

    let query = supabase
      .from("transactions")
      .select("*, accounts(name, institution_name)", { count: "exact" })
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    // Apply filters
    const accountId = searchParams.get("accountId");
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "500");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (accountId) {
      query = query.eq("account_id", accountId);
    }
    if (category) {
      query = query.eq("category", category);
    }
    if (startDate) {
      query = query.gte("date", startDate);
    }
    if (endDate) {
      query = query.lte("date", endDate);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,merchant_name.ilike.%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({ data, count });
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

/**
 * Create a new transaction
 * POST /api/transactions
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    // Validate input
    const result = createTransactionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    // Verify account belongs to user
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("id")
      .eq("id", result.data.account_id)
      .eq("user_id", user.id)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 400 }
      );
    }

    const insertData: InsertTransaction = {
      ...result.data,
      user_id: user.id,
      is_manual: true,
    };

    const { data, error } = await supabase
      .from("transactions")
      .insert(insertData)
      .select("*, accounts(name, institution_name)")
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Create transaction error:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
