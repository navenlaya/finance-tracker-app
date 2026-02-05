import { NextResponse } from "next/server";
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode, PlaidError } from "plaid";
import { AxiosError } from "axios";
import { requireAuth } from "@/lib/supabase/server";

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
 * Create a Plaid Link token
 * GET /api/plaid/link-token
 */
export async function GET() {
  try {
    // Check if Plaid is configured
    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
      return NextResponse.json(
        { error: "Plaid is not configured" },
        { status: 400 }
      );
    }

    const user = await requireAuth();

    // Build request - don't include redirect_uri unless it's configured in Plaid dashboard
    const linkRequest = {
      user: {
        client_user_id: user.id,
      },
      client_name: "Finance Tracker Demo",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en" as const,
    };

    const response = await plaidClient.linkTokenCreate(linkRequest);

    return NextResponse.json({
      linkToken: response.data.link_token,
      expiration: response.data.expiration,
    });
  } catch (error) {
    console.error("Link token error:", error);
    
    // Extract Plaid-specific error details
    if (error instanceof AxiosError && error.response?.data) {
      const plaidError = error.response.data as PlaidError;
      console.error("Plaid error details:", {
        error_type: plaidError.error_type,
        error_code: plaidError.error_code,
        error_message: plaidError.error_message,
        display_message: plaidError.display_message,
      });
      return NextResponse.json(
        { 
          error: plaidError.error_message || "Failed to create link token",
          code: plaidError.error_code,
          type: plaidError.error_type,
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create link token" },
      { status: 500 }
    );
  }
}
