-- RPC to increment session count on profile
CREATE OR REPLACE FUNCTION increment_session_count(uid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET total_sessions = COALESCE(total_sessions, 0) + 1,
      last_active_at = NOW()
  WHERE user_id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
