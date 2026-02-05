import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { createBudgetSchema } from "@/lib/validations";
import type { InsertBudget } from "@/types/database";

/**
 * Get all budgets for the current user
 * GET /api/budgets
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);

    const month = searchParams.get("month");

    let query = supabase
      .from("budgets")
      .select("*")
      .eq("user_id", user.id)
      .order("category");

    if (month) {
      query = query.eq("month", month);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get budgets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch budgets" },
      { status: 500 }
    );
  }
}

/**
 * Create a new budget
 * POST /api/budgets
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    // Validate input
    const result = createBudgetSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    // Check for duplicate budget
    const { data: existing } = await supabase
      .from("budgets")
      .select("id")
      .eq("user_id", user.id)
      .eq("category", result.data.category)
      .eq("month", result.data.month)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "A budget for this category already exists for this month" },
        { status: 400 }
      );
    }

    const insertData: InsertBudget = {
      ...result.data,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from("budgets")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Create budget error:", error);
    return NextResponse.json(
      { error: "Failed to create budget" },
      { status: 500 }
    );
  }
}
