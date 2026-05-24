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
      plans: {
        Row: {
          code: string;
          name: string;
          description: string;
          features: Json;
          max_users: number;
          max_workspaces: number;
          max_stripe_connections: number;
          max_stripe_connections_per_workspace: number;
          max_xero_connections_per_workspace: number;
          stripe_price_id: string | null;
          sort_order: number;
          created_at: string | null;
        };
        Insert: {
          code: string;
          name: string;
          description?: string;
          features?: Json;
          max_users: number;
          max_workspaces: number;
          max_stripe_connections: number;
          max_stripe_connections_per_workspace?: number;
          max_xero_connections_per_workspace?: number;
          stripe_price_id?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database['core']['Tables']['plans']['Insert']>;
        Relationships: [];
      };
      accounts: {
        Row: {
          id: string;
          name: string;
          plan: string;
          plan_code: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: string | null;
          trial_ends_at: string | null;
          current_period_end: string | null;
          max_users: number;
          max_workspaces: number;
          onboarding_completed_at: string | null;
          billing_downgrade_completed_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          plan?: string;
          plan_code?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string | null;
          trial_ends_at?: string | null;
          current_period_end?: string | null;
          max_users?: number;
          max_workspaces?: number;
          onboarding_completed_at?: string | null;
          billing_downgrade_completed_at?: string | null;
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
          refresh_failed_at: string | null;
          refresh_error_code: string | null;
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
          refresh_failed_at?: string | null;
          refresh_error_code?: string | null;
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
          is_default: boolean;
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
          is_default?: boolean;
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
        Update: Partial<
          Database['core']['Tables']['account_invitations']['Insert'] & {
            accepted_at?: string | null;
            token?: string;
            expires_at?: string | null;
          }
        >;
        Relationships: [];
      };
      invitation_workspaces: {
        Row: {
          invitation_id: string;
          workspace_id: string;
        };
        Insert: {
          invitation_id: string;
          workspace_id: string;
        };
        Update: Partial<
          Database['core']['Tables']['invitation_workspaces']['Insert']
        >;
        Relationships: [];
      };
      account_user_workspaces: {
        Row: {
          account_user_id: string;
          workspace_id: string;
        };
        Insert: {
          account_user_id: string;
          workspace_id: string;
        };
        Update: Partial<
          Database['core']['Tables']['account_user_workspaces']['Insert']
        >;
        Relationships: [];
      };
      excel_auth_handoffs: {
        Row: {
          nonce: string;
          access_token: string;
          expires_at: string;
        };
        Insert: {
          nonce: string;
          access_token: string;
          expires_at?: string;
        };
        Update: Partial<
          Database['core']['Tables']['excel_auth_handoffs']['Insert']
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      check_plan_limit: {
        Args: {
          p_account_id: string;
          p_resource: string;
          p_workspace_id?: string;
        };
        Returns: boolean;
      };
      lock_user_provisioning: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      unlock_user_provisioning: {
        Args: { p_user_id: string };
        Returns: undefined;
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
