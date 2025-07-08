-- Fix duplicate recipients issue
CREATE OR REPLACE FUNCTION distribute_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_classes text[];
  target_subjects text[];
  target_boards text[];
  target_languages text[];
  is_send_to_all boolean;
BEGIN
  -- Handle null or empty target
  IF NEW.target IS NULL OR NEW.target = '{}'::jsonb OR NEW.target = '{"classes":[],"subjects":[],"boards":[],"languages":[]}'::jsonb THEN
    -- Send to everyone, with ON CONFLICT DO NOTHING to handle duplicates
    INSERT INTO notification_recipients (notification_id, user_id)
    SELECT DISTINCT NEW.id, id FROM profiles
    ON CONFLICT (notification_id, user_id) DO NOTHING;
    RETURN NEW;
  END IF;

  -- Extract arrays from jsonb
  target_classes := ARRAY(
    SELECT jsonb_array_elements_text(CASE 
      WHEN NEW.target->'classes' IS NULL OR NEW.target->'classes' = 'null'::jsonb 
      THEN '[]'::jsonb 
      ELSE NEW.target->'classes' 
    END)
  )::text[];
  
  target_subjects := ARRAY(
    SELECT jsonb_array_elements_text(CASE 
      WHEN NEW.target->'subjects' IS NULL OR NEW.target->'subjects' = 'null'::jsonb 
      THEN '[]'::jsonb 
      ELSE NEW.target->'subjects' 
    END)
  )::text[];
  
  target_boards := ARRAY(
    SELECT jsonb_array_elements_text(CASE 
      WHEN NEW.target->'boards' IS NULL OR NEW.target->'boards' = 'null'::jsonb 
      THEN '[]'::jsonb 
      ELSE NEW.target->'boards' 
    END)
  )::text[];
  
  target_languages := ARRAY(
    SELECT jsonb_array_elements_text(CASE 
      WHEN NEW.target->'languages' IS NULL OR NEW.target->'languages' = 'null'::jsonb 
      THEN '[]'::jsonb 
      ELSE NEW.target->'languages' 
    END)
  )::text[];

  -- Check if all arrays are empty (meaning send to everyone)
  is_send_to_all := 
    (target_classes IS NULL OR array_length(target_classes, 1) IS NULL) AND
    (target_subjects IS NULL OR array_length(target_subjects, 1) IS NULL) AND
    (target_boards IS NULL OR array_length(target_boards, 1) IS NULL) AND
    (target_languages IS NULL OR array_length(target_languages, 1) IS NULL);

  -- Insert into notification_recipients
  IF is_send_to_all THEN
    -- Send to everyone, with ON CONFLICT DO NOTHING
    INSERT INTO notification_recipients (notification_id, user_id)
    SELECT DISTINCT NEW.id, id FROM profiles
    ON CONFLICT (notification_id, user_id) DO NOTHING;
  ELSE
    -- Send only to matching users, with ON CONFLICT DO NOTHING
    WITH matching_users AS (
      SELECT DISTINCT p.id
      FROM profiles p
      WHERE 
        -- If no classes selected OR user's class matches
        (array_length(target_classes, 1) IS NULL OR 
         p.class = ANY(target_classes))
        AND
        -- If no subjects selected OR user's subjects match
        (array_length(target_subjects, 1) IS NULL OR 
         p.subjects && target_subjects)
        AND
        -- If no boards selected OR user's board matches
        (array_length(target_boards, 1) IS NULL OR 
         p.board = ANY(target_boards))
        AND
        -- If no languages selected OR user's languages match
        (array_length(target_languages, 1) IS NULL OR 
         p.languages && target_languages)
    )
    INSERT INTO notification_recipients (notification_id, user_id)
    SELECT NEW.id, id FROM matching_users
    ON CONFLICT (notification_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
