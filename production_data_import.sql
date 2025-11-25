-- PRODUCTION DATABASE IMPORT SCRIPT
-- Run this in the Database pane with "Production" mode enabled

-- ============================================
-- STEP 1: INSERT USERS (required for authentication)
-- ============================================
INSERT INTO users (email, name, role, phone, has_logged_in, active) VALUES
('staff@morelandestate.co.uk', 'staff', 'admin', '07700900123', false, true),
('newstaff@morelandestate.co.uk', 'newstaff', 'admin', '07700900789', false, true),
('stafftest3fug@morelandestate.co.uk', 'stafftest3fug', 'admin', '07700900666', false, true),
('adminc_fx@morelandestate.co.uk', 'adminc_fx', 'admin', '07700900111', false, true),
('test@morelandestate.co.uk', 'test', 'staff', '447123456789', false, true),
('lf@ground-rent.com', 'LF', 'superuser', '+447539355690', true, true),
('lf@morelandestate.co.uk', 'lf', 'staff', '447999888777', true, true)
ON CONFLICT (email) DO UPDATE SET 
  role = EXCLUDED.role, 
  phone = EXCLUDED.phone, 
  has_logged_in = EXCLUDED.has_logged_in,
  name = EXCLUDED.name,
  active = EXCLUDED.active;

-- ============================================
-- STEP 2: INSERT LOSS ASSESSORS
-- ============================================
INSERT INTO loss_assessors (company_name, contact_name, email, phone, specializations, address, notes, active) VALUES
('Test Loss Assessors Ltd k-In - Updated', 'John Smith', 'testk-In@assessors.com', '020 1234 5678', '{"Fire damage","Water damage"}', '123 Test Street, London', 'Test assessor created by automated test', true),
('Assessor Co', 'Jane Assessor', 'jane@assessor.com', '9876543210', NULL, NULL, NULL, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 3: INSERT CLAIMS
-- ============================================
INSERT INTO claims (reference_number, status, claimant_name, claimant_email, claimant_phone, property_address, incident_date, incident_type, incident_description, has_building_damage, has_theft, theft_police_reported, signature_type, signature_data, declaration_accepted, fraud_warning_accepted, contents_exclusion_accepted, is_investment_property, current_stage, submitted_at, late_notification_acknowledged) VALUES
('AUTO--PG4Jp', 'closed', 'Auto Test Claimant', 'auto@example.com', '020 9999 0000', '1 Test Rd, Testville', '2025-11-24', 'Leak', 'Automated test claim created for E2E testing. This description is intentionally long to meet validation rules and provide sufficient detail for the test case.', false, false, false, 'typed', 'signed:automated', true, true, false, false, 'submitted', NOW(), false),
('TEST-Z3P6OVYC', 'pending', 'John Tenant', 'john.tenant@gmail.com', '1234567890', '123 Test St', '2024-01-15', 'water_damage', 'Water leak in kitchen', false, false, false, 'typed', '{}', true, true, false, false, 'new', NOW(), false),
('TEST-HXNYITAW', 'pending', 'Test Claimant', 'claimant@test.com', '5555555555', '456 Test Ave', '2024-02-20', 'fire', 'Kitchen fire', false, false, false, 'typed', '{}', true, true, false, false, 'new', NOW(), false),
('TEST-UKIMFV6G', 'pending', 'Another Claimant', 'another@test.com', '1111111111', '789 Test Rd', '2024-03-10', 'theft', 'Burglary', false, false, false, 'typed', '{}', true, true, false, false, 'new', NOW(), false),
('TEST-VJER9ICX', 'pending', 'Ref Test', 'reftest@gmail.com', '2222222222', '999 Test Blvd', '2024-04-01', 'water_damage', 'Pipe burst', false, false, false, 'typed', '{}', true, true, false, false, 'new', NOW(), false),
('TEST-A-0001', 'submitted', 'Tenant A', 'tenanta@gmail.com', '1234567890', '123 Test St', '2024-01-15', 'water_damage', 'Leak', false, false, false, 'drawn', 'signature-data-A', true, true, false, false, 'new', NOW(), false),
('TEST-B-0002', 'submitted', 'Tenant B', 'tenantb@gmail.com', '0987654321', '456 Other St', '2024-02-20', 'fire', 'Kitchen fire', false, false, false, 'drawn', 'signature-data-B', true, true, false, false, 'new', NOW(), false),
('TEST-1764023314', 'submitted', 'Test Tenant', 'testuser@example.com', '1234567890', '123 Test Street, AB12CD', '2024-01-15', 'water_damage', 'Water leak in kitchen', false, false, false, 'typed', 'TestSignature', true, true, true, false, 'new', NOW(), false),
('MEI-MIDS1B6S-AFS8', 'submitted', 'Test Claimant 2OAV8a', 'testclaimzH5jop@example.com', '07700900555', '500 Manchester Rd, Linthwaite, Huddersfield HD7 5RD, UK', '2025-11-24', 'escape_of_water', 'A water leak from the upstairs flat caused significant damage to the ceiling and walls of the property, requiring immediate attention.', false, false, false, 'typed', 'TestSig', true, true, true, false, 'new', NOW(), false),
('MEI-MIDSLI7X-CPWH', 'submitted', 'Final Test User', 'finaltestLNBE3l@example.com', '07700900999', 'Test Rd, London SW15, UK', '2025-11-20', 'escape_of_water', 'A water leak from the upstairs bathroom caused significant damage to the ceiling and walls. Water was dripping through light fixtures and damaged the floor. Required emergency plumber.', false, false, false, 'typed', 'TestSig', true, true, true, false, 'new', NOW(), false),
('MEI-MIDTI7T0-HXIX', 'submitted', 'Test User xSWxAb', 'testlIHSHA@example.com', '07700900123', '10 Downing St, London SW1A 2AB, UK', '2025-11-25', 'fire', 'Test incident for progress bar testing. Water entered property causing visible damage to flooring and ceilings.', false, false, false, 'typed', 'TestSig', true, true, true, false, 'new', NOW(), false)
ON CONFLICT (reference_number) DO NOTHING;

-- ============================================
-- VERIFICATION: Check data was inserted
-- ============================================
-- Run these separately to verify:
-- SELECT COUNT(*) as user_count FROM users;
-- SELECT COUNT(*) as claim_count FROM claims;
-- SELECT COUNT(*) as assessor_count FROM loss_assessors;
