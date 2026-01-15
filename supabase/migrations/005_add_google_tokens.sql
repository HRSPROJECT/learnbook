-- Add Google OAuth token columns to user_profiles for Calendar/Drive integration
-- These tokens are needed because Supabase only provides provider_token during the OAuth callback

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.google_access_token IS 'Google OAuth access token for Calendar/Drive APIs';
COMMENT ON COLUMN user_profiles.google_refresh_token IS 'Google OAuth refresh token for renewing access';
COMMENT ON COLUMN user_profiles.google_token_expires_at IS 'Expiration time of the Google access token';
