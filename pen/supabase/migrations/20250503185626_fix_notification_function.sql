-- Fix notification function to properly handle sending to everyone
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
  IF NEW.target IS NULL OR NEW.target = '{}'::jsonb THEN
    -- If target is null or empty, send to everyone
    INSERT INTO notification_recipients (notification_id, user_id)
    SELECT NEW.id, id FROM profiles;
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
    array_length(target_classes, 1) IS NULL AND
    array_length(target_subjects, 1) IS NULL AND
    array_length(target_boards, 1) IS NULL AND
    array_length(target_languages, 1) IS NULL;

  -- Insert into notification_recipients
  IF is_send_to_all THEN
    -- Send to everyone if no specific targets
    INSERT INTO notification_recipients (notification_id, user_id)
    SELECT NEW.id, id FROM profiles;
  ELSE
    -- Send only to matching users
    INSERT INTO notification_recipients (notification_id, user_id)
    SELECT 
      NEW.id,
      p.id
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
       p.languages && target_languages);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
