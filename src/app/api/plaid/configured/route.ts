import { NextResponse } from "next/server";

/**
 * Check if Plaid is configured
 * GET /api/plaid/configured
 */
export async function GET() {
  const configured =
    !!process.env.PLAID_CLIENT_ID &&
    !!process.env.PLAID_SECRET &&
    !!process.env.ENCRYPTION_KEY;

  return NextResponse.json({ configured });
}
