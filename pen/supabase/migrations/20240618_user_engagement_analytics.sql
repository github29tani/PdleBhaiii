-- User Engagement Analytics Migration
-- This adds comprehensive user engagement tracking

-- Create user_engagement_metrics table
CREATE TABLE IF NOT EXISTS public.user_engagement_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Note Statistics
  notes_uploaded INT DEFAULT 0,
  note_views INT DEFAULT 0,
  note_downloads INT DEFAULT 0,
  note_likes INT DEFAULT 0,
  note_shares INT DEFAULT 0,
  
  -- Engagement Metrics
  comments_made INT DEFAULT 0,
  replies_received INT DEFAULT 0,
  messages_sent INT DEFAULT 0,
  groups_joined INT DEFAULT 0,
  
  -- Session Data
  sessions_count INT DEFAULT 0,
  total_session_duration INT DEFAULT 0, -- in seconds
  
  -- Performance Metrics
  avg_note_rating DECIMAL(3,2) DEFAULT 0,
  notes_saved INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_engagement_metrics_user_id ON public.user_engagement_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_engagement_metrics_date ON public.user_engagement_metrics(date);

-- Enable RLS
ALTER TABLE public.user_engagement_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own metrics" 
ON public.user_engagement_metrics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all metrics" 
ON public.user_engagement_metrics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users u
    JOIN public.profiles p ON p.id = u.id
    WHERE u.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- Function to update user engagement metrics
CREATE OR REPLACE FUNCTION public.update_user_engagement_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if we should update existing row or insert new one
  IF EXISTS (
    SELECT 1 FROM public.user_engagement_metrics 
    WHERE user_id = COALESCE(NEW.user_id, auth.uid())
    AND date = CURRENT_DATE
  ) THEN
    -- Update existing metrics
    UPDATE public.user_engagement_metrics
    SET 
      notes_uploaded = notes_uploaded + COALESCE(NEW.notes_uploaded, 0),
      note_views = note_views + COALESCE(NEW.note_views, 0),
      note_downloads = note_downloads + COALESCE(NEW.note_downloads, 0),
      note_likes = note_likes + COALESCE(NEW.note_likes, 0),
      note_shares = note_shares + COALESCE(NEW.note_shares, 0),
      comments_made = comments_made + COALESCE(NEW.comments_made, 0),
      replies_received = replies_received + COALESCE(NEW.replies_received, 0),
      messages_sent = messages_sent + COALESCE(NEW.messages_sent, 0),
      groups_joined = groups_joined + COALESCE(NEW.groups_joined, 0),
      sessions_count = sessions_count + COALESCE(NEW.sessions_count, 0),
      total_session_duration = total_session_duration + COALESCE(NEW.total_session_duration, 0),
      notes_saved = notes_saved + COALESCE(NEW.notes_saved, 0),
      updated_at = NOW()
    WHERE user_id = COALESCE(NEW.user_id, auth.uid())
    AND date = CURRENT_DATE;
  ELSE
    -- Insert new metrics
    INSERT INTO public.user_engagement_metrics (
      user_id,
      notes_uploaded,
      note_views,
      note_downloads,
      note_likes,
      note_shares,
      comments_made,
      replies_received,
      messages_sent,
      groups_joined,
      sessions_count,
      total_session_duration,
      notes_saved
    ) VALUES (
      COALESCE(NEW.user_id, auth.uid()),
      COALESCE(NEW.notes_uploaded, 0),
      COALESCE(NEW.note_views, 0),
      COALESCE(NEW.note_downloads, 0),
      COALESCE(NEW.note_likes, 0),
      COALESCE(NEW.note_shares, 0),
      COALESCE(NEW.comments_made, 0),
      COALESCE(NEW.replies_received, 0),
      COALESCE(NEW.messages_sent, 0),
      COALESCE(NEW.groups_joined, 0),
      COALESCE(NEW.sessions_count, 0),
      COALESCE(NEW.total_session_duration, 0),
      COALESCE(NEW.notes_saved, 0)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user engagement summary
CREATE OR REPLACE FUNCTION public.get_user_engagement_summary(
  p_user_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days'),
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  total_notes_uploaded BIGINT,
  total_note_views BIGINT,
  total_note_downloads BIGINT,
  total_note_likes BIGINT,
  total_note_shares BIGINT,
  avg_daily_sessions DECIMAL(10,2),
  avg_session_duration_seconds DECIMAL(10,2),
  engagement_score DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the user has permission
  IF p_user_id IS NOT NULL AND p_user_id != auth.uid() AND 
     NOT EXISTS (
       SELECT 1 FROM public.profiles 
       WHERE id = auth.uid() AND role = 'admin'
     ) THEN
    RAISE EXCEPTION 'You can only view your own engagement data';
  END IF;

  RETURN QUERY
  WITH user_metrics AS (
    SELECT 
      uem.user_id,
      p.username,
      p.avatar_url,
      SUM(uem.notes_uploaded) as total_notes_uploaded,
      SUM(uem.note_views) as total_note_views,
      SUM(uem.note_downloads) as total_note_downloads,
      SUM(uem.note_likes) as total_note_likes,
      SUM(uem.note_shares) as total_note_shares,
      COUNT(DISTINCT uem.date) as days_active,
      SUM(uem.sessions_count) as total_sessions,
      SUM(uem.total_session_duration) as total_duration_seconds
    FROM public.user_engagement_metrics uem
    JOIN public.profiles p ON p.id = uem.user_id
    WHERE 
      (p_user_id IS NULL OR uem.user_id = p_user_id)
      AND uem.date BETWEEN p_start_date AND p_end_date
    GROUP BY uem.user_id, p.username, p.avatar_url
  )
  SELECT 
    user_id,
    username,
    avatar_url,
    total_notes_uploaded,
    total_note_views,
    total_note_downloads,
    total_note_likes,
    total_note_shares,
    CASE 
      WHEN days_active > 0 THEN total_sessions::DECIMAL / days_active
      ELSE 0 
    END as avg_daily_sessions,
    CASE 
      WHEN total_sessions > 0 THEN total_duration_seconds::DECIMAL / total_sessions
      ELSE 0 
    END as avg_session_duration_seconds,
    -- Simple engagement score calculation (can be customized)
    (
      (total_notes_uploaded * 10) +
      (total_note_views * 0.1) +
      (total_note_downloads * 2) +
      (total_note_likes * 1.5) +
      (total_note_shares * 3) +
      (total_duration_seconds / 60) -- Convert to minutes
    ) as engagement_score
  FROM user_metrics
  ORDER BY engagement_score DESC;
END;
$$;

-- Function to get note statistics
CREATE OR REPLACE FUNCTION public.get_note_statistics(
  p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days'),
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  date DATE,
  total_uploads BIGINT,
  total_views BIGINT,
  total_downloads BIGINT,
  total_likes BIGINT,
  total_shares BIGINT,
  avg_rating DECIMAL(3,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin access
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can view note statistics';
  END IF;

  RETURN QUERY
  SELECT 
    date,
    SUM(notes_uploaded) as total_uploads,
    SUM(note_views) as total_views,
    SUM(note_downloads) as total_downloads,
    SUM(note_likes) as total_likes,
    SUM(note_shares) as total_shares,
    CASE 
      WHEN SUM(notes_uploaded) > 0 
      THEN ROUND(SUM(avg_note_rating * notes_uploaded)::DECIMAL / NULLIF(SUM(notes_uploaded), 0), 2)
      ELSE 0 
    END as avg_rating
  FROM public.user_engagement_metrics
  WHERE date BETWEEN p_start_date AND p_end_date
  GROUP BY date
  ORDER BY date;
END;
$$;

-- Function to get user growth metrics
CREATE OR REPLACE FUNCTION public.get_user_growth_metrics(
  p_period_days INT DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  new_users BIGINT,
  active_users BIGINT,
  retained_users BIGINT,
  churned_users BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin access
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can view user growth metrics';
  END IF;

  RETURN QUERY
  WITH date_series AS (
    SELECT 
      generate_series(
        CURRENT_DATE - (p_period_days || ' days')::interval,
        CURRENT_DATE,
        '1 day'::interval
      )::date as date
  )
  SELECT 
    ds.date,
    COUNT(DISTINCT CASE 
      WHEN p.created_at::date = ds.date THEN p.id 
    END) as new_users,
    COUNT(DISTINCT CASE 
      WHEN uem.date = ds.date AND uem.sessions_count > 0 THEN uem.user_id 
    END) as active_users,
    COUNT(DISTINCT CASE 
      WHEN p.created_at <= (ds.date - INTERVAL '1 day')::date 
      AND EXISTS (
        SELECT 1 FROM public.user_engagement_metrics uem2 
        WHERE uem2.user_id = p.id 
        AND uem2.date = ds.date 
        AND uem2.sessions_count > 0
      ) THEN p.id 
    END) as retained_users,
    COUNT(DISTINCT CASE 
      WHEN p.created_at <= (ds.date - INTERVAL '1 day')::date 
      AND NOT EXISTS (
        SELECT 1 FROM public.user_engagement_metrics uem3 
        WHERE uem3.user_id = p.id 
        AND uem3.date = ds.date 
        AND uem3.sessions_count > 0
      ) 
      AND EXISTS (
        SELECT 1 FROM public.user_engagement_metrics uem4 
        WHERE uem4.user_id = p.id 
        AND uem4.date = (ds.date - INTERVAL '1 day')::date 
        AND uem4.sessions_count > 0
      ) THEN p.id 
    END) as churned_users
  FROM date_series ds
  CROSS JOIN public.profiles p
  LEFT JOIN public.user_engagement_metrics uem ON uem.date = ds.date
  GROUP BY ds.date
  ORDER BY ds.date;
END;
$$;

-- Create a trigger function to update metrics when a note is uploaded
CREATE OR REPLACE FUNCTION public.handle_note_uploaded()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_engagement_metrics (user_id, notes_uploaded)
  VALUES (NEW.uploader_id, 1)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    notes_uploaded = user_engagement_metrics.notes_uploaded + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Create a trigger function to update metrics when a note is viewed
CREATE OR REPLACE FUNCTION public.handle_note_viewed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.analytics_events (event_type, user_id, metadata)
  VALUES ('note_viewed', auth.uid(), jsonb_build_object('note_id', NEW.note_id));
  
  INSERT INTO public.user_engagement_metrics (user_id, note_views)
  VALUES (NEW.user_id, 1)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    note_views = user_engagement_metrics.note_views + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Create a trigger function to update metrics when a note is downloaded
CREATE OR REPLACE FUNCTION public.handle_note_downloaded()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_engagement_metrics (user_id, note_downloads)
  VALUES (NEW.user_id, 1)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    note_downloads = user_engagement_metrics.note_downloads + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Create a trigger function to update metrics when a note is liked
CREATE OR REPLACE FUNCTION public.handle_note_liked()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the note owner's metrics
  INSERT INTO public.user_engagement_metrics (user_id, note_likes)
  SELECT uploader_id, 1
  FROM public.notes
  WHERE id = NEW.note_id
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    note_likes = user_engagement_metrics.note_likes + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Create a trigger function to update metrics when a note is shared
CREATE OR REPLACE FUNCTION public.handle_note_shared()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the note owner's metrics
  INSERT INTO public.user_engagement_metrics (user_id, note_shares)
  SELECT uploader_id, 1
  FROM public.notes
  WHERE id = NEW.note_id
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    note_shares = user_engagement_metrics.note_shares + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Create a trigger function to update metrics when a comment is made
CREATE OR REPLACE FUNCTION public.handle_comment_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the commenter's metrics
  INSERT INTO public.user_engagement_metrics (user_id, comments_made)
  VALUES (NEW.user_id, 1)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    comments_made = user_engagement_metrics.comments_made + 1,
    updated_at = NOW();
  
  -- Update the note owner's metrics for replies
  IF NEW.parent_comment_id IS NOT NULL THEN
    INSERT INTO public.user_engagement_metrics (user_id, replies_received)
    SELECT user_id, 1
    FROM public.comments
    WHERE id = NEW.parent_comment_id
    ON CONFLICT (user_id, date) 
    DO UPDATE SET 
      replies_received = user_engagement_metrics.replies_received + 1,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create a trigger function to update metrics when a message is sent
CREATE OR REPLACE FUNCTION public.handle_message_sent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_engagement_metrics (user_id, messages_sent)
  VALUES (NEW.sender_id, 1)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    messages_sent = user_engagement_metrics.messages_sent + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Create a trigger function to update metrics when a user joins a group
CREATE OR REPLACE FUNCTION public.handle_group_joined()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_engagement_metrics (user_id, groups_joined)
  VALUES (NEW.user_id, 1)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    groups_joined = user_engagement_metrics.groups_joined + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);

-- Create a materialized view for daily engagement metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.daily_engagement_metrics AS
SELECT 
  date,
  COUNT(DISTINCT user_id) as active_users,
  SUM(notes_uploaded) as total_notes_uploaded,
  SUM(note_views) as total_note_views,
  SUM(note_downloads) as total_note_downloads,
  SUM(note_likes) as total_note_likes,
  SUM(note_shares) as total_note_shares,
  SUM(comments_made) as total_comments,
  SUM(messages_sent) as total_messages,
  SUM(sessions_count) as total_sessions,
  ROUND(AVG(
    CASE 
      WHEN sessions_count > 0 THEN total_session_duration::DECIMAL / sessions_count 
      ELSE 0 
    END
  )::numeric, 2) as avg_session_duration_seconds,
  NOW() as last_updated
FROM public.user_engagement_metrics
GROUP BY date
ORDER BY date DESC;

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION public.refresh_daily_engagement_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.daily_engagement_metrics;
END;
$$;

-- Create a scheduled job to refresh the materialized view daily
-- Note: This requires the pg_cron extension to be enabled in Supabase
-- Uncomment and run this in the Supabase SQL editor if pg_cron is enabled
-- SELECT cron.schedule(
--   'refresh-daily-engagement-metrics',
--   '0 0 * * *', -- Run at midnight every day
--   'SELECT public.refresh_daily_engagement_metrics()'
-- );

-- Grant necessary permissions
GRANTANT SELECT ON public.user_engagement_metrics TO authenticated;
GRANT SELECT ON public.daily_engagement_metrics TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
