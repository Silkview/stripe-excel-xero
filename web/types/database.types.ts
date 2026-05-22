export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  core: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          name: string;
          plan: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: string | null;
          trial_ends_at: string | null;
          current_period_end: string | null;
          max_users: number;
          max_workspaces: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          plan?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string | null;
          trial_ends_at?: string | null;
          current_period_end?: string | null;
          max_users?: number;
          max_workspaces?: number;
        };
        Update: Partial<Database['core']['Tables']['accounts']['Insert']>;
        Relationships: [];
      };
      account_users: {
        Row: {
          id: string;
          account_id: string;
          user_id: string;
          role: string;
          invited_by: string | null;
          joined_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          account_id: string;
          user_id: string;
          role?: string;
          invited_by?: string | null;
        };
        Update: Partial<Database['core']['Tables']['account_users']['Insert']>;
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          account_id: string;
          name: string;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          account_id: string;
          name: string;
          created_by?: string | null;
        };
        Update: Partial<Database['core']['Tables']['workspaces']['Insert']>;
        Relationships: [];
      };
      xero_connections: {
        Row: {
          id: string;
          workspace_id: string;
          tenant_id: string;
          tenant_name: string | null;
          base_currency: string | null;
          access_token_encrypted: string;
          refresh_token_encrypted: string;
          token_expires_at: string;
          scopes: string[] | null;
          connected_by: string | null;
          connected_at: string | null;
          last_refreshed_at: string | null;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          tenant_id: string;
          tenant_name?: string | null;
          base_currency?: string | null;
          access_token_encrypted: string;
          refresh_token_encrypted: string;
          token_expires_at: string;
          scopes?: string[] | null;
          connected_by?: string | null;
          last_refreshed_at?: string | null;
          is_active?: boolean | null;
        };
        Update: Partial<Database['core']['Tables']['xero_connections']['Insert']>;
        Relationships: [];
      };
      stripe_connections: {
        Row: {
          id: string;
          workspace_id: string;
          stripe_account_id: string;
          display_name: string | null;
          access_token_encrypted: string;
          livemode: boolean | null;
          scope: string | null;
          connected_by: string | null;
          connected_at: string | null;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          stripe_account_id: string;
          display_name?: string | null;
          access_token_encrypted: string;
          livemode?: boolean | null;
          scope?: string | null;
          connected_by?: string | null;
          is_active?: boolean | null;
        };
        Update: Partial<Database['core']['Tables']['stripe_connections']['Insert']>;
        Relationships: [];
      };
      account_invitations: {
        Row: {
          id: string;
          account_id: string;
          email: string;
          role: string;
          token: string;
          invited_by: string | null;
          expires_at: string | null;
          accepted_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          account_id: string;
          email: string;
          role?: string;
          invited_by?: string | null;
        };
        Update: Partial<Database['core']['Tables']['account_invitations']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      check_plan_limit: {
        Args: { p_account_id: string; p_resource: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
