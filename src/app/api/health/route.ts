import { NextResponse } from "next/server";

/**
 * Health check endpoint
 * GET /api/health
 */
export async function GET() {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    checks: {
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      plaid: !!process.env.PLAID_CLIENT_ID && !!process.env.PLAID_SECRET,
      encryption: !!process.env.ENCRYPTION_KEY,
    },
  };

  return NextResponse.json(health);
}
