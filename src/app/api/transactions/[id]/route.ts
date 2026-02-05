import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { updateTransactionSchema } from "@/lib/validations";
import type { UpdateTransaction } from "@/types/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Get a single transaction
 * GET /api/transactions/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("transactions")
      .select("*, accounts(name, institution_name)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get transaction error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction" },
      { status: 500 }
    );
  }
}

/**
 * Update a transaction
 * PATCH /api/transactions/[id]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    // Validate input
    const result = updateTransactionSchema.safeParse({ ...body, id });
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { id: _id, ...updateData } = result.data;

    // If account_id is being changed, verify ownership
    if (updateData.account_id) {
      const { data: account, error: accountError } = await supabase
        .from("accounts")
        .select("id")
        .eq("id", updateData.account_id)
        .eq("user_id", user.id)
        .single();

      if (accountError || !account) {
        return NextResponse.json(
          { error: "Account not found" },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabase
      .from("transactions")
      .update(updateData as UpdateTransaction)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*, accounts(name, institution_name)")
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update transaction error:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

/**
 * Delete a transaction
 * DELETE /api/transactions/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete transaction error:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
