/**
 * Database types matching Supabase schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
        };
        Insert: {
          id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      plaid_items: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          access_token_encrypted: string;
          institution_id: string | null;
          institution_name: string | null;
          cursor: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          access_token_encrypted: string;
          institution_id?: string | null;
          institution_name?: string | null;
          cursor?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_id?: string;
          access_token_encrypted?: string;
          institution_id?: string | null;
          institution_name?: string | null;
          cursor?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "plaid_items_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          plaid_item_id: string | null;
          plaid_account_id: string | null;
          name: string;
          official_name: string | null;
          mask: string | null;
          type: string;
          subtype: string | null;
          current_balance: number | null;
          available_balance: number | null;
          institution_name: string | null;
          is_manual: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plaid_item_id?: string | null;
          plaid_account_id?: string | null;
          name: string;
          official_name?: string | null;
          mask?: string | null;
          type: string;
          subtype?: string | null;
          current_balance?: number | null;
          available_balance?: number | null;
          institution_name?: string | null;
          is_manual?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plaid_item_id?: string | null;
          plaid_account_id?: string | null;
          name?: string;
          official_name?: string | null;
          mask?: string | null;
          type?: string;
          subtype?: string | null;
          current_balance?: number | null;
          available_balance?: number | null;
          institution_name?: string | null;
          is_manual?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "accounts_plaid_item_id_fkey";
            columns: ["plaid_item_id"];
            referencedRelation: "plaid_items";
            referencedColumns: ["id"];
          }
        ];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          plaid_transaction_id: string | null;
          date: string;
          name: string;
          merchant_name: string | null;
          amount: number;
          currency: string;
          category: string | null;
          pending: boolean;
          note: string | null;
          is_manual: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          plaid_transaction_id?: string | null;
          date: string;
          name: string;
          merchant_name?: string | null;
          amount: number;
          currency?: string;
          category?: string | null;
          pending?: boolean;
          note?: string | null;
          is_manual?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          plaid_transaction_id?: string | null;
          date?: string;
          name?: string;
          merchant_name?: string | null;
          amount?: number;
          currency?: string;
          category?: string | null;
          pending?: boolean;
          note?: string | null;
          is_manual?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_account_id_fkey";
            columns: ["account_id"];
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          }
        ];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          month: string;
          limit_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          month: string;
          limit_amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: string;
          month?: string;
          limit_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type PlaidItem = Database["public"]["Tables"]["plaid_items"]["Row"];
export type Account = Database["public"]["Tables"]["accounts"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type Budget = Database["public"]["Tables"]["budgets"]["Row"];

export type InsertProfile = Database["public"]["Tables"]["profiles"]["Insert"];
export type InsertPlaidItem = Database["public"]["Tables"]["plaid_items"]["Insert"];
export type InsertAccount = Database["public"]["Tables"]["accounts"]["Insert"];
export type InsertTransaction = Database["public"]["Tables"]["transactions"]["Insert"];
export type InsertBudget = Database["public"]["Tables"]["budgets"]["Insert"];

export type UpdateAccount = Database["public"]["Tables"]["accounts"]["Update"];
export type UpdateTransaction = Database["public"]["Tables"]["transactions"]["Update"];
export type UpdateBudget = Database["public"]["Tables"]["budgets"]["Update"];
