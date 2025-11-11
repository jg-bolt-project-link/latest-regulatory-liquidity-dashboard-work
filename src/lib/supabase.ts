import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'present' : 'missing',
    key: supabaseAnonKey ? 'present' : 'missing',
    env: import.meta.env
  });
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          company_name: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          company_name?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          company_name?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          account_type: string;
          currency: string;
          current_balance: number;
          institution: string | null;
          account_number: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          account_type: string;
          currency?: string;
          current_balance?: number;
          institution?: string | null;
          account_number?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          account_type?: string;
          currency?: string;
          current_balance?: number;
          institution?: string | null;
          account_number?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          account_id: string;
          user_id: string;
          transaction_date: string;
          description: string;
          amount: number;
          transaction_type: string;
          category: string | null;
          reference_number: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          user_id: string;
          transaction_date?: string;
          description: string;
          amount: number;
          transaction_type: string;
          category?: string | null;
          reference_number?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          user_id?: string;
          transaction_date?: string;
          description?: string;
          amount?: number;
          transaction_type?: string;
          category?: string | null;
          reference_number?: string | null;
          created_at?: string;
        };
      };
      liquidity_reports: {
        Row: {
          id: string;
          user_id: string;
          report_date: string;
          report_type: string;
          total_assets: number;
          total_liabilities: number;
          net_liquidity: number;
          cash_ratio: number | null;
          quick_ratio: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          report_date?: string;
          report_type: string;
          total_assets?: number;
          total_liabilities?: number;
          net_liquidity?: number;
          cash_ratio?: number | null;
          quick_ratio?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          report_date?: string;
          report_type?: string;
          total_assets?: number;
          total_liabilities?: number;
          net_liquidity?: number;
          cash_ratio?: number | null;
          quick_ratio?: number | null;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
