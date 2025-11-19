/*
  # Make user_id nullable in accounts and transactions tables

  This migration removes the NOT NULL constraint from user_id columns in the accounts
  and transactions tables to support operation without authentication.

  ## Changes
  
  1. **accounts table**
    - Modify `user_id` column to allow NULL values
    - This allows system-level accounts with no user association
  
  2. **transactions table**
    - Modify `user_id` column to allow NULL values
    - This allows system-level transactions with no user association

  ## Background
  
  Since authentication has been removed from the application, user_id should be nullable
  across all tables. The FR2052a and regulatory metrics tables already have nullable user_id,
  but accounts and transactions were missed.
*/

-- Make user_id nullable in accounts table
ALTER TABLE accounts 
ALTER COLUMN user_id DROP NOT NULL;

-- Make user_id nullable in transactions table
ALTER TABLE transactions 
ALTER COLUMN user_id DROP NOT NULL;
