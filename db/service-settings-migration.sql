-- ============================================================
-- SERVICE SETTINGS — Akubrecah Entertainment
-- Control which services are active on the platform
-- ============================================================

CREATE TABLE IF NOT EXISTS service_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_key TEXT UNIQUE NOT NULL,
    service_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial services
INSERT INTO service_settings (service_key, service_name, description) VALUES
('register_kra_pin', 'Register KRA PIN', 'New KRA PIN registration service'),
('renew_kra_password', 'Renew KRA Password', 'KRA account password renewal/reset'),
('change_kra_email', 'Change KRA Email', 'Update KRA account email address'),
('file_nil_returns', 'File Nil Returns', 'Submission of NIL tax returns'),
('register_nssf', 'Register NSSF', 'NSSF member registration'),
('register_shif', 'Register SHIF', 'SHIF (Social Health Insurance Fund) registration'),
('kra_retrieval', 'KRA Retrieval', 'Retrieve KRA PIN and related tax documents')
ON CONFLICT (service_key) DO NOTHING;

-- Enable RLS
ALTER TABLE service_settings ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access on service_settings"
    ON service_settings FOR ALL USING (true) WITH CHECK (true);

-- Public can read active status
CREATE POLICY "Public can read service_settings"
    ON service_settings FOR SELECT USING (true);
