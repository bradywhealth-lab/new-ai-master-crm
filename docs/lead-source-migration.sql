-- Add source column to leads table with enum values
-- Sources track where leads come from for better attribution and analysis

DO $$
BEGIN
  -- Create ENUM type for lead sources
  CREATE TYPE IF NOT EXISTS lead_source_enum AS ENUM (
    'referral',
    'website',
    'linkedin',
    'facebook',
    'google',
    'other',
    'manual'
  );

  -- Add source column to leads table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'source'
  ) THEN
    ALTER TABLE leads ADD COLUMN source lead_source_enum DEFAULT 'manual';
  END IF;

  -- Add comment for clarity
  COMMENT ON COLUMN leads.source IS 'Lead source: referral, website, linkedin, facebook, google, other, or manual';
END $$;
