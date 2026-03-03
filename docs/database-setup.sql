-- ========================================
-- InsureAssist Database Setup (Task 3)
-- ========================================

-- Step 1: Create profiles table (extends Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone_number TEXT UNIQUE,
  agency_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create csv_uploads table
CREATE TABLE csv_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  row_count INTEGER,
  status TEXT DEFAULT 'pending',
  error_message TEXT
);

-- Step 3: Create leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Contact info
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,

  -- Source tracking
  source_type TEXT NOT NULL,
  csv_upload_id UUID REFERENCES csv_uploads(id) ON DELETE SET NULL,
  source_filename TEXT,
  source_row_id TEXT,

  -- Disposition and tags
  disposition TEXT DEFAULT 'new',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,

  -- AI-qualified
  ai_score INTEGER,
  ai_qualification_reason TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  normalized_email TEXT,
  normalized_phone TEXT
);

-- Step 4: Create sms_logs table
CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  twilio_message_id TEXT UNIQUE,
  direction TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),

  -- AI analysis
  ai_category TEXT,
  ai_confidence INTEGER,
  ai_analysis TEXT
);

-- Step 5: Create sms_templates table
CREATE TABLE sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE
);

-- Step 6: Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can CRUD their own leads
CREATE POLICY "Users can CRUD own leads"
  ON leads FOR ALL
  USING (auth.uid() = user_id);

-- Users can CRUD their own CSV uploads
CREATE POLICY "Users can CRUD own csv_uploads"
  ON csv_uploads FOR ALL
  USING (auth.uid() = user_id);

-- Users can CRUD their own SMS logs
CREATE POLICY "Users can CRUD own sms_logs"
  ON sms_logs FOR ALL
  USING (auth.uid() = user_id);

-- Users can CRUD their own templates
CREATE POLICY "Users can CRUD own templates"
  ON sms_templates FOR ALL
  USING (auth.uid() = user_id);

-- Step 8: Create indexes for performance
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_disposition ON leads(disposition);
CREATE INDEX idx_leads_csv_upload_id ON leads(csv_upload_id);
CREATE INDEX idx_leads_tags ON leads USING GIN(tags);
CREATE INDEX idx_sms_logs_lead_id ON sms_logs(lead_id);
CREATE INDEX idx_sms_logs_user_id ON sms_logs(user_id);
CREATE INDEX idx_csv_uploads_user_id ON csv_uploads(user_id);
