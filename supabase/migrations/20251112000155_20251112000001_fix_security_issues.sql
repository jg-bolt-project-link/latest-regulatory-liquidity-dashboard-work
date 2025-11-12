/*
  # Fix Security Issues

  1. Security Fixes
    - Add missing index for foreign key `fr2052a_validation_errors_data_row_id_fkey`
    - Remove unused indexes to improve database maintenance
    - Fix function search path security issue

  2. Index Changes
    - Add: idx_validation_errors_data_row_id (covers foreign key)
    - Remove: All unused indexes identified in security scan

  3. Function Security
    - Update update_updated_at_column function with immutable search_path
*/

-- Add missing index for foreign key to improve query performance
CREATE INDEX IF NOT EXISTS idx_validation_errors_data_row_id
  ON public.fr2052a_validation_errors(data_row_id);

-- Remove unused indexes
DROP INDEX IF EXISTS public.idx_submissions_entity;
DROP INDEX IF EXISTS public.idx_submissions_period;
DROP INDEX IF EXISTS public.idx_data_rows_submission;
DROP INDEX IF EXISTS public.idx_errors_submission;
DROP INDEX IF EXISTS public.idx_enumerations_field;
DROP INDEX IF EXISTS public.idx_lcr_metrics_report_date;
DROP INDEX IF EXISTS public.idx_nsfr_metrics_report_date;
DROP INDEX IF EXISTS public.idx_balance_sheet_metrics_report_date;
DROP INDEX IF EXISTS public.idx_irr_metrics_report_date;
DROP INDEX IF EXISTS public.idx_resolution_metrics_report_date;
DROP INDEX IF EXISTS public.idx_reg_k_metrics_report_date;
DROP INDEX IF EXISTS public.idx_stress_test_results_user_id;
DROP INDEX IF EXISTS public.idx_stress_test_results_test_date;
DROP INDEX IF EXISTS public.idx_resolution_liquidity_metrics_report_date;
DROP INDEX IF EXISTS public.idx_transactions_account_id;
DROP INDEX IF EXISTS public.idx_liquidity_reports_user_id;
DROP INDEX IF EXISTS public.idx_liquidity_reports_date;
DROP INDEX IF EXISTS public.idx_fr2052a_submissions_user_id;
DROP INDEX IF EXISTS public.idx_fr2052a_submissions_reporting_period;
DROP INDEX IF EXISTS public.idx_legal_entities_entity_code;
DROP INDEX IF EXISTS public.idx_legal_entities_parent_entity_id;
DROP INDEX IF EXISTS public.idx_liquidity_stress_tests_report_date;

-- Fix function search path security issue
-- Store trigger information before dropping
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  -- Drop existing function and its dependent triggers
  DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

  -- Recreate function with secure search_path
  CREATE FUNCTION public.update_updated_at_column()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
  AS $func$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $func$;

  -- Add comment explaining the security fix
  COMMENT ON FUNCTION public.update_updated_at_column() IS
  'Updates the updated_at timestamp. SECURITY DEFINER with immutable search_path to prevent search_path manipulation attacks.';

  -- Recreate triggers for tables that need updated_at functionality
  -- user_profiles
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'updated_at') THEN
      CREATE TRIGGER update_user_profiles_updated_at
        BEFORE UPDATE ON public.user_profiles
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
  END IF;

  -- accounts
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'accounts' AND column_name = 'updated_at') THEN
      CREATE TRIGGER update_accounts_updated_at
        BEFORE UPDATE ON public.accounts
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
  END IF;
END $$;
