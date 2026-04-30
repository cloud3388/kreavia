-- ============================================================
-- Kreavia.ai — Security Additions
-- Run this in Supabase SQL Editor to enable rate limiting and email validation
-- ============================================================

-- 1. Table for rate limiting IPs (can be placed in public schema)
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup and cleanup
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_ip ON public.auth_rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_created_at ON public.auth_rate_limits(created_at);

-- 2. Function to validate email and rate limit
CREATE OR REPLACE FUNCTION public.validate_user_signup()
RETURNS trigger AS $$
DECLARE
  v_email_domain TEXT;
  v_ip_address TEXT;
  v_creation_count INTEGER;
  
  -- Allowed domains exactly as requested
  v_allowed_domains TEXT[] := ARRAY[
    'gmail.com', 'googlemail.com',
    'yahoo.com', 'yahoo.in', 'yahoo.co.uk', 'yahoo.co.in', 'ymail.com',
    'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
    'icloud.com', 'me.com', 'mac.com',
    'protonmail.com', 'proton.me'
  ];
BEGIN
  -- Extract and lowercase domain from new email
  v_email_domain := lower(split_part(NEW.email, '@', 2));
  
  -- 1. Check if domain is in allowed list
  -- If not allowed, it covers both known bad domains and any unknown/custom email
  IF NOT (v_email_domain = ANY(v_allowed_domains)) THEN
    RAISE EXCEPTION 'Please sign in with Google, Microsoft or Yahoo to continue. Temporary or custom email addresses are not supported.';
  END IF;

  -- 2. Rate limiting by IP Address
  -- Extract IP from Supabase request headers (x-forwarded-for)
  BEGIN
    v_ip_address := current_setting('request.headers', true)::json->>'x-forwarded-for';
    -- Get true client IP if it's a comma-separated list
    v_ip_address := split_part(v_ip_address, ',', 1);
  EXCEPTION WHEN OTHERS THEN
    v_ip_address := NULL;
  END;
  
  IF v_ip_address IS NOT NULL AND v_ip_address != '' THEN
    
    -- Cleanup old records older than 24 hours
    DELETE FROM public.auth_rate_limits WHERE created_at < NOW() - INTERVAL '24 hours';
    
    -- Count creations from this IP in last 24 hours
    SELECT count(*) INTO v_creation_count 
    FROM public.auth_rate_limits 
    WHERE ip_address = v_ip_address 
      AND created_at > NOW() - INTERVAL '24 hours';
      
    IF v_creation_count >= 3 THEN
      RAISE EXCEPTION 'Too many accounts created from your location. Please try again tomorrow.';
    END IF;
    
    -- Record this creation
    INSERT INTO public.auth_rate_limits (ip_address) VALUES (v_ip_address);
    
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the Trigger on auth.users
-- Note: auth schema requires superuser permissions, so we must run this in the Supabase SQL Editor
DROP TRIGGER IF EXISTS trg_validate_user_signup ON auth.users;
CREATE TRIGGER trg_validate_user_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_signup();
